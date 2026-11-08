from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


OpportunityType = Literal["scholarship", "internship"]
ReviewStatus = Literal["pending_review", "approved", "rejected"]


class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: OpportunityType
    source: str
    source_url: str
    deadline: str | None
    summary: str
    eligibility: str
    status: ReviewStatus
    ai_confidence: float
    verification_status: str
    verification_url: str | None
    verification_note: str | None
    verified_at: datetime | None
    official_url: str | None
    official_verification_status: str | None
    official_verified_at: datetime | None
    discovered_at: datetime


class ReviewRequest(BaseModel):
    status: Literal["approved", "rejected"]
