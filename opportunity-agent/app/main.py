import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .agent import discover, last_run
from .config import settings
from .db import get_counts, get_opportunity, init_db, list_verified_opportunities, review_opportunity
from .schemas import OpportunityResponse, ReviewRequest

logging.basicConfig(level=logging.INFO)
scheduler = AsyncIOScheduler()


async def require_agent_key(x_agent_key: str | None = Header(default=None)) -> None:
    if not x_agent_key or x_agent_key != settings.agent_api_key:
        raise HTTPException(status_code=401, detail="Invalid agent API key")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    scheduler.add_job(discover, "interval", minutes=settings.fetch_interval_minutes, id="discovery", replace_existing=True)
    scheduler.add_job(discover, "date", run_date=datetime.now(timezone.utc), id="initial-discovery", replace_existing=True)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="Opportunity Finder Agent", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Agent-Key"],
)


@app.get("/")
def root() -> dict:
    return {"service": "opportunity-agent", "health": "/health", "docs": "/docs"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "opportunity-agent"}


@app.get("/api/agent/status", dependencies=[Depends(require_agent_key)])
def agent_status() -> dict:
    counts = get_counts()
    return {
        "status": "running" if last_run["status"] == "running" else "ready",
        "service": "opportunity-agent",
        "scheduler_interval_minutes": settings.fetch_interval_minutes,
        "counts": counts,
        "last_run": last_run,
    }


@app.get("/api/opportunities", response_model=list[OpportunityResponse], dependencies=[Depends(require_agent_key)])
def list_opportunities(
    type: str | None = Query(default=None, pattern="^(scholarship|internship)$"),
    status: str = Query(default="pending_review", pattern="^(pending_review|approved|rejected|all)$"),
) -> list[dict]:
    return list_verified_opportunities(type, status)


@app.post("/api/opportunities/{opportunity_id}/review", response_model=OpportunityResponse, dependencies=[Depends(require_agent_key)])
def review_opportunity_route(opportunity_id: int, payload: ReviewRequest) -> dict:
    opportunity = review_opportunity(opportunity_id, payload.status)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity


@app.post("/api/agent/run", dependencies=[Depends(require_agent_key)])
async def run_agent() -> dict:
    inserted = await discover()
    return {"inserted": inserted}
