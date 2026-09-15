import hashlib
import math
import os
import warnings
from pathlib import Path
from typing import Any, cast

# Suppress deprecation warnings from legacy generativeai package
warnings.filterwarnings("ignore", category=FutureWarning)

import google.generativeai as genai  # noqa: E402
from dotenv import load_dotenv  # noqa: E402

# Search and load .env from backend or root directory
env_candidates = [
    Path(__file__).resolve().parents[2] / ".env",
    Path(".env"),
    Path("backend/.env"),
]
for p in env_candidates:
    if p.exists():
        load_dotenv(dotenv_path=str(p))


def setup_genai() -> None:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    else:
        print("WARNING: GEMINI_API_KEY not set")


EMBEDDING_MODELS = [
    "models/gemini-embedding-2",
    "models/gemini-embedding-001",
    "models/gemini-embedding-2-preview",
]
GENERATION_MODELS = [
    "models/gemini-3.5-flash",
    "models/gemini-3.7-flash",
    "models/gemini-3-flash-preview",
    "models/gemini-3.1-flash-lite-preview",
    "gemini-flash-latest",
    "gemini-2.5-flash",
]


def _deterministic_local_embedding(text: str, dim: int = 3072) -> list[float]:
    """Fallback local pseudo-embedding when Gemini API quota is exhausted."""
    vec = [0.0] * dim
    words = text.lower().split()
    if not words:
        return vec
    for word in words:
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if ((h >> 8) & 1) else -1.0
        vec[idx] += sign
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    setup_genai()
    for model_name in EMBEDDING_MODELS:
        try:
            response = genai.embed_content(
                model=model_name,
                content=texts,
            )
            return cast(list[list[float]], response["embedding"])
        except Exception as e:
            print(f"Warning: Embedding model {model_name} failed: {e}. Trying fallback...")

    # If all remote models fail (e.g. 429 quota exhaustion), fallback locally
    print("Warning: All remote embedding models exhausted. Using local fallback embeddings.")
    return [_deterministic_local_embedding(t, dim=3072) for t in texts]


def _generate_with_fallback(
    system_instruction: str,
    prompt: str,
    generation_config: Any = None,
) -> str:
    setup_genai()
    last_err: Exception | None = None
    for model_name in GENERATION_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_instruction,
            )
            response = model.generate_content(
                prompt,
                generation_config=generation_config,
            )
            if response and response.text:
                return response.text
        except Exception as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    return ""


def generate_answer(query: str, context: str) -> str:
    system_instruction = (
        "You are RepoLens, an AI codebase intelligence engine.\n"
        "Your job is to answer developer questions using repository "
        "evidence.\n"
        "Use ONLY the repository context supplied to you.\n"
        "Never invent:\n"
        "- files\n"
        "- functions\n"
        "- classes\n"
        "- endpoints\n"
        "- dependencies\n"
        "- implementation details\n\n"
        "For important claims, identify the supporting file and symbol.\n"
        "If there is insufficient evidence, explicitly state that\n"
        "there is insufficient evidence.\n"
        "Do not treat semantic similarity as proof that a component\n"
        "implements the requested functionality.\n"
        "Prefer direct repository evidence.\n"
        "Keep answers concise and technically useful."
    )

    prompt = f"Context:\n{context}\n\nQuestion: {query}"
    return _generate_with_fallback(
        system_instruction,
        prompt,
        {"temperature": 0.0},
    )


def generate_trace(query: str, context: str) -> str:
    system_instruction = (
        "You are RepoLens, an AI codebase intelligence engine.\n"
        "Your job is to trace how a request or function flows through "
        "the codebase based on the provided context.\n"
        "Output MUST be valid JSON matching this schema:\n"
        "{\n"
        '  "nodes": [{"id": "string", "label": "string", "file": "string", '
        '"type": "string"}],\n'
        '  "edges": [{"source": "string", "target": "string", '
        '"label": "string"}]\n'
        "}\n"
        "Every id referenced in edges MUST exist in nodes.\n"
        "Never invent nodes that do not exist in the context."
    )
    prompt = f"Context:\n{context}\n\nTrace Query: {query}"
    return _generate_with_fallback(
        system_instruction,
        prompt,
        {"temperature": 0.0, "response_mime_type": "application/json"},
    )


def generate_impact(symbol: str, context: str) -> str:
    system_instruction = (
        "You are RepoLens. Given a target function/symbol and codebase "
        "context, analyze the potential blast radius and impact of "
        "modifying it.\n"
        "Output MUST be valid JSON matching this schema:\n"
        "{\n"
        '  "summary": "string",\n'
        '  "level": "HIGH|MEDIUM|LOW",\n'
        '  "affected_files_count": 0,\n'
        '  "nodes": [{"id": "string", "label": "string", "file": "string", '
        '"type": "string"}],\n'
        '  "edges": [{"source": "string", "target": "string"}]\n'
        "}\n"
        "Make the target symbol the central node. Every id referenced in "
        "edges MUST exist in nodes."
    )
    prompt = f"Context:\n{context}\n\nTarget Symbol: {symbol}"
    return _generate_with_fallback(
        system_instruction,
        prompt,
        {"temperature": 0.0, "response_mime_type": "application/json"},
    )


def generate_onboard(context: str) -> str:
    system_instruction = (
        "You are RepoLens. Generate a comprehensive New Developer Mode "
        "onboarding guide in Markdown.\n"
        "Use ONLY the repository context provided "
        "(file list and descriptions).\n"
        "Include:\n"
        "1. Architecture Overview (High-level data and request flow)\n"
        "2. Core Modules & Key Symbols\n"
        "3. Recommended Starting Points (actual files to read first)\n"
        "4. Suggested Learning Path"
    )
    prompt = f"Repository Context:\n{context}"
    return _generate_with_fallback(
        system_instruction,
        prompt,
        {"temperature": 0.2},
    )
