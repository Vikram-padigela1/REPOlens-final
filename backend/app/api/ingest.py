from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.parser_service import extract_code_units
from app.services.repo_service import (
    cleanup_repo,
    clone_and_get_files,
    discover_and_filter_files,
)
from app.services.retrieval_service import ingest_units, vector_store

router = APIRouter()


class IngestRequest(BaseModel):
    repo_url: str


@router.post("/ingest")
def ingest_repo(req: IngestRequest):
    repo_path = None
    try:
        # Reset vector store so previous repository embeddings do not conflict
        vector_store.clear()

        is_remote = (
            "github.com" in req.repo_url or req.repo_url.startswith("http")
        )
        if not is_remote:
            # Check candidate locations for demo / local repo
            candidates = [
                Path(req.repo_url),
                Path("demo-repo"),
                Path("../demo-repo"),
                Path(__file__).resolve().parents[3] / "demo-repo",
            ]
            resolved = None
            for cand in candidates:
                if cand.exists() and cand.is_dir():
                    resolved = str(cand.resolve())
                    break
            if not resolved:
                raise HTTPException(
                    status_code=404,
                    detail=f"Could not find local repository: {req.repo_url}",
                )
            repo_path = resolved
            files = discover_and_filter_files(repo_path)
        else:
            repo_path, files = clone_and_get_files(req.repo_url)

        all_units = []

        # Parse and extract code units using Tree-sitter AST
        for f in files:
            units = extract_code_units(f["full_path"], f["rel_path"], f["ext"])
            all_units.extend(units)

        classes = sum(1 for u in all_units if u.get("unit_type") == "class")
        functions = sum(
            1 for u in all_units if u.get("unit_type") == "function"
        )

        # Chunk units to avoid embedding API batch limits
        chunk_size = 50
        for i in range(0, len(all_units), chunk_size):
            ingest_units(all_units[i:i + chunk_size])

        return {
            "status": "success",
            "repo_url": req.repo_url,
            "files": len(files),
            "functions": functions,
            "classes": classes,
            "total_units": len(all_units),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if repo_path and "tmp" in repo_path:
            cleanup_repo(repo_path)
