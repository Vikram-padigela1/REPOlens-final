from pydantic import BaseModel


class IngestRequest(BaseModel):
    repo_url: str


class AskRequest(BaseModel):
    query: str


class SourceEvidence(BaseModel):
    file: str
    symbol: str
    start_line: int
    end_line: int
    code: str


class AskResponse(BaseModel):
    answer: str
    confidence: float
    confidence_label: str
    sources: list[SourceEvidence]


class TraceRequest(BaseModel):
    query: str


class ImpactRequest(BaseModel):
    symbol: str
