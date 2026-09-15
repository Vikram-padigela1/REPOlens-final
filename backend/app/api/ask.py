import json

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm_service import (
    generate_answer,
    generate_impact,
    generate_onboard,
    generate_trace,
)
from app.services.retrieval_service import (
    get_all_context_summary,
    retrieve_context,
    search_symbols,
)

router = APIRouter()


class AskRequest(BaseModel):
    query: str


class TraceRequest(BaseModel):
    query: str


class ImpactRequest(BaseModel):
    symbol: str


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


def clean_json_text(text: str) -> str:
    t = text.strip()
    if t.startswith("```json"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    t = t.removesuffix("```")
    return t.strip()


def sanitize_flow_graph(graph: dict) -> dict:
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    node_ids = {n.get("id") for n in nodes if n.get("id")}

    sanitized_edges = []
    for e in edges:
        src = e.get("source")
        tgt = e.get("target")
        if not src or not tgt:
            continue
        # Ensure referenced source/target nodes exist
        if src not in node_ids:
            nodes.append(
                {
                    "id": src,
                    "label": src.split("::")[-1],
                    "file": "",
                    "type": "function",
                }
            )
            node_ids.add(src)
        if tgt not in node_ids:
            nodes.append(
                {
                    "id": tgt,
                    "label": tgt.split("::")[-1],
                    "file": "",
                    "type": "function",
                }
            )
            node_ids.add(tgt)
        sanitized_edges.append(e)

    return {"nodes": nodes, "edges": sanitized_edges}


@router.post("/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    context, sources, top_score = retrieve_context(req.query)
    if top_score < 0.20 or not context.strip():
        return AskResponse(
            answer=(
                "Insufficient evidence\n\n"
                "RepoLens could not find enough relevant repository evidence "
                "to confidently answer this question."
            ),
            confidence=top_score,
            confidence_label="Low",
            sources=[],
        )
    answer = generate_answer(req.query, context)
    mapped_sources = [
        SourceEvidence(
            file=s["file_path"],
            symbol=s["symbol_name"],
            start_line=s["start_line"],
            end_line=s["end_line"],
            code=s["code"],
        )
        for s in sources
    ]
    if top_score >= 0.65:
        label = "High"
    elif top_score >= 0.45:
        label = "Medium"
    else:
        label = "Low"
    return AskResponse(
        answer=answer,
        confidence=top_score,
        confidence_label=label,
        sources=mapped_sources,
    )


@router.post("/trace")
def trace_flow(req: TraceRequest):
    context, _, _ = retrieve_context(req.query)
    resp = generate_trace(req.query, context)
    try:
        data = json.loads(clean_json_text(resp))
        return sanitize_flow_graph(data)
    except Exception as e:
        print(f"Error parsing trace: {e}")
        return {"nodes": [], "edges": []}


@router.post("/impact")
def impact_analysis(req: ImpactRequest):
    context, _, _ = retrieve_context(req.symbol)
    resp = generate_impact(req.symbol, context)
    try:
        data = json.loads(clean_json_text(resp))
        graph = sanitize_flow_graph(data)
        return {
            "summary": data.get("summary", "Impact analysis complete."),
            "level": data.get("level", "LOW"),
            "affected_files_count": data.get(
                "affected_files_count", len(graph["nodes"])
            ),
            "nodes": graph["nodes"],
            "edges": graph["edges"],
        }
    except Exception as e:
        print(f"Error parsing impact: {e}")
        return {
            "summary": "Error parsing impact analysis.",
            "level": "LOW",
            "affected_files_count": 0,
            "nodes": [],
            "edges": [],
        }


@router.post("/onboard")
def onboard():
    context = get_all_context_summary()
    resp = generate_onboard(context)
    return {"markdown": resp}


@router.get("/search")
def search(q: str = ""):
    return search_symbols(q)
