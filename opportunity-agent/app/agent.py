import json
import logging
import re
import asyncio
import ipaddress
import socket
from datetime import datetime
from urllib.parse import urljoin, urlparse
import httpx
from bs4 import BeautifulSoup
from openai import AsyncOpenAI
from .config import settings
from .db import find_by_source_url, insert_opportunity, update_opportunity

logger = logging.getLogger(__name__)
SOURCES = [
    "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    "https://www.opportunitiesforafricans.com/category/scholarships/",
    "https://www.internships.com/",
    "https://www.opportunitiesforafricans.com/category/internships/",
    "https://www.unicef.org/careers/internships",
]
discovery_lock = asyncio.Lock()
last_run: dict[str, object] = {
    "status": "idle",
    "started_at": None,
    "finished_at": None,
    "inserted": 0,
    "error": None,
}


async def fetch_page(url: str) -> tuple[str, str]:
    current_url = url
    async with httpx.AsyncClient(
        timeout=settings.request_timeout_seconds,
        follow_redirects=False,
        headers={"User-Agent": "OpportunityFinderBot/1.0 (+admin review service)"},
    ) as client:
        for _ in range(5):
            parsed = urlparse(current_url)
            await validate_public_host(parsed.hostname, parsed.scheme)
            response = await client.get(current_url)
            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    raise ValueError("Redirect response has no destination")
                current_url = urljoin(current_url, location)
                continue
            response.raise_for_status()
            return current_url, response.text
    raise ValueError("Too many redirects")


async def validate_public_host(hostname: str | None, scheme: str | None = None) -> None:
    if scheme not in {"http", "https"} or not hostname:
        raise ValueError("Only HTTP(S) URLs with a hostname are allowed")
    addresses = await asyncio.to_thread(socket.getaddrinfo, hostname, None)
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise ValueError(f"Blocked non-public destination: {hostname}")


def extract_candidates(source_url: str, html: str) -> list[dict[str, str]]:
    def clean(value: str) -> str:
        value = " ".join(value.split())
        if "â" in value or "�" in value:
            try:
                value = value.encode("latin1").decode("utf-8")
            except UnicodeError:
                pass
        return value

    def find_deadline(text: str) -> str | None:
        match = re.search(
            r"(?i)\b(?:deadline|closing date|application closes?)\s*[:\-]?\s*"
            r"([0-3]?\d[./-][01]?\d[./-](?:20)?\d{2}|"
            r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+[0-3]?\d,?\s+\d{4})",
            text,
        )
        return match.group(1) if match else None

    soup = BeautifulSoup(html, "html.parser")
    candidates = []
    for link in soup.select("a[href]"):
        title = clean(link.get_text(" ", strip=True))
        href = link.get("href", "")
        if (
            len(title) < 12
            or re.fullmatch(r"(?i)(scholarships?|internships?)(?:\s*\(\d[\d,]*\))?", title)
            or not href.startswith(("http://", "https://"))
        ):
            continue
        text = clean(link.parent.get_text(" ", strip=True))
        candidates.append({
            "title": title[:500],
            "url": href[:2000],
            "text": text[:5000],
            "deadline": find_deadline(text),
        })
    return candidates[:100]


def keyword_classify(candidate: dict[str, str]) -> dict:
    text = f"{candidate['title']} {candidate['text']}".lower()
    scholarship_words = ("scholarship", "fellowship", "grant", "tuition", "funded")
    internship_words = ("internship", "intern", "placement", "trainee")
    scholarship_score = sum(word in text for word in scholarship_words)
    internship_score = sum(word in text for word in internship_words)
    if scholarship_score == internship_score == 0:
        return {"type": None, "confidence": 0.0}
    kind = "scholarship" if scholarship_score >= internship_score else "internship"
    return {"type": kind, "confidence": min(0.95, 0.55 + 0.1 * max(scholarship_score, internship_score))}


async def enrich_with_llm(candidate: dict[str, str], fallback: dict) -> dict:
    if not settings.openai_api_key:
        return {**candidate, **fallback, "summary": candidate["text"][:600]}
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    prompt = (
        "Classify this opportunity. Return JSON with keys type (scholarship or internship), "
        "summary, eligibility, deadline, confidence (0 to 1). Do not invent missing facts. "
        f"Title: {candidate['title']}\nText: {candidate['text']}"
    )
    response = await client.chat.completions.create(
        model=settings.openai_model,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    data = json.loads(response.choices[0].message.content or "{}")
    if data.get("type") not in ("scholarship", "internship"):
        return {**candidate, **fallback, "summary": candidate["text"][:600]}
    return {
        **candidate,
        "type": data["type"],
        "summary": data.get("summary") or candidate["text"][:600],
        "eligibility": data.get("eligibility") or "",
        "deadline": data.get("deadline") or candidate.get("deadline"),
        "confidence": float(data.get("confidence", fallback["confidence"])),
    }


def verify_content(title: str, html: str) -> tuple[str, str]:
    page_text = " ".join(BeautifulSoup(html, "html.parser").get_text(" ", strip=True).split()).lower()
    title_words = [word for word in re.findall(r"[a-z0-9]{4,}", title.lower()) if word not in {"fully", "funded"}]
    matches = sum(word in page_text for word in title_words)
    if matches >= max(2, len(title_words) // 2):
        return "verified", "Original page fetched successfully and the opportunity title was found on the page."
    return "warning", "Original page opened successfully, but its page text did not closely match the discovered title."


def find_official_url(source_url: str, html: str) -> str | None:
    source_host = urlparse(source_url).hostname
    soup = BeautifulSoup(html, "html.parser")
    keywords = ("apply", "application", "official website", "employer", "university website")
    for link in soup.select("a[href]"):
        href = urljoin(source_url, link.get("href", ""))
        text = " ".join(link.get_text(" ", strip=True).lower().split())
        parsed = urlparse(href)
        if (
            parsed.scheme in {"http", "https"}
            and parsed.hostname
            and parsed.hostname != source_host
            and any(keyword in text for keyword in keywords)
        ):
            return href[:2000]
    return None


async def verify_official_site(source_url: str, source_html: str, title: str) -> tuple[str | None, str]:
    official_url = find_official_url(source_url, source_html)
    if not official_url:
        return None, "No external official application or university/employer website was found."
    try:
        verified_url, official_html = await fetch_page(official_url)
        official_text = " ".join(BeautifulSoup(official_html, "html.parser").get_text(" ", strip=True).split()).lower()
        lowered_url = verified_url.lower()
        if "closedform" in lowered_url or "not_found=true" in lowered_url or "page not found" in official_text or "no longer accepting" in official_text:
            return None, "The linked official application page appears closed or unavailable."
        title_words = [word for word in re.findall(r"[a-z0-9]{4,}", title.lower()) if word not in {"fully", "funded"}]
        matches = sum(word in official_text for word in title_words)
        if matches < 2:
            return None, "Official link opened, but its content did not match the opportunity title."
        return verified_url, "Official application/university/employer page fetched and matched the opportunity."
    except (httpx.HTTPError, ValueError) as error:
        return None, f"Official page could not be verified: {error}"


async def _discover() -> int:
    inserted = 0
    seen_urls: set[str] = set()
    for source_url in SOURCES:
            try:
                final_url, html = await fetch_page(source_url)
                for candidate in extract_candidates(final_url, html):
                    fallback = keyword_classify(candidate)
                    if not fallback["type"]:
                        continue
                    enriched = await enrich_with_llm(candidate, fallback)
                    if enriched["url"] in seen_urls:
                        continue
                    seen_urls.add(enriched["url"])
                    exists = find_by_source_url(enriched["url"])
                    if exists:
                        if exists.get("verified_at") is None or not exists.get("verification_url") or exists.get("official_verification_status") != "verified":
                            try:
                                verified_url, verified_html = await fetch_page(exists["source_url"])
                                verification_status, verification_note = verify_content(exists["title"], verified_html)
                                official_url, official_note = await verify_official_site(verified_url, verified_html, exists["title"])
                                update_opportunity(exists["source_url"], {
                                    "verification_status": verification_status,
                                    "verification_note": f"{verification_note} {official_note}",
                                    "verification_url": verified_url,
                                    "verified_at": datetime.utcnow(),
                                    "official_url": official_url,
                                    "official_verification_status": "verified" if official_url else "failed",
                                    "official_verified_at": datetime.utcnow() if official_url else None,
                                })
                            except (httpx.HTTPError, ValueError) as error:
                                update_opportunity(exists["source_url"], {
                                    "verification_status": "failed",
                                    "verification_note": f"Original page could not be verified: {error}",
                                    "verification_url": None,
                                    "verified_at": datetime.utcnow(),
                                })
                        continue
                    try:
                        verified_url, verified_html = await fetch_page(enriched["url"])
                        verification, verification_note = verify_content(enriched["title"], verified_html)
                        official_url, official_note = await verify_official_site(verified_url, verified_html, enriched["title"])
                        official_status = "verified" if official_url else "failed"
                        official_verified_at = datetime.utcnow() if official_url else None
                        verification_note = f"{verification_note} {official_note}"
                    except (httpx.HTTPError, ValueError) as error:
                        logger.warning("Could not verify opportunity URL: %s", enriched["url"])
                        verification = "failed"
                        verified_url = None
                        verification_note = f"Original page could not be verified: {error}"
                        official_url = None
                        official_status = "failed"
                        official_verified_at = None
                    if verification != "verified" or official_status != "verified":
                        logger.info("Skipping unverified opportunity: %s", enriched["title"])
                        continue
                    inserted += int(insert_opportunity({
                        "title": enriched["title"],
                        "type": enriched["type"],
                        "source": urlparse(final_url).netloc,
                        "source_url": enriched["url"],
                        "deadline": enriched.get("deadline"),
                        "summary": enriched["summary"],
                        "eligibility": enriched.get("eligibility", ""),
                        "ai_confidence": enriched["confidence"],
                        "verification_status": verification,
                        "verification_url": verified_url,
                        "verification_note": verification_note,
                        "verified_at": datetime.utcnow(),
                        "official_url": official_url,
                        "official_verification_status": official_status,
                        "official_verified_at": official_verified_at,
                        "discovered_at": datetime.utcnow(),
                    }))
            except (httpx.HTTPError, ValueError) as error:
                logger.exception("Source fetch failed for %s: %s", source_url, error)
    return inserted


async def discover() -> int:
    if discovery_lock.locked():
        logger.info("Discovery already running; skipping overlapping run.")
        return 0
    async with discovery_lock:
        last_run.update({"status": "running", "started_at": datetime.utcnow().isoformat(), "error": None})
        try:
            inserted = await _discover()
            last_run.update({
                "status": "idle",
                "finished_at": datetime.utcnow().isoformat(),
                "inserted": inserted,
            })
            return inserted
        except Exception as error:
            last_run.update({
                "status": "error",
                "finished_at": datetime.utcnow().isoformat(),
                "error": str(error),
            })
            raise
