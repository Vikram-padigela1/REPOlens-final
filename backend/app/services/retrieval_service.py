import os

from .llm_service import generate_embeddings
from .vector_store import VectorStore

vector_store = VectorStore()
if os.path.exists(vector_store.index_path):
    vector_store.load()


def retrieve_context(query: str):
    # Semantic search
    embeddings = generate_embeddings([query])
    if not embeddings:
        return "", [], 0.0
    q_emb = embeddings[0]
    results = vector_store.search(q_emb, k=20)

    # Lightweight hybrid retrieval: Boost score if query keywords match symbol
    query_terms = [t for t in query.lower().split() if len(t) > 2]

    final_candidates = []
    seen_locations = set()

    for r in results:
        meta = r["metadata"]
        # Deduplicate based on file path and line numbers
        loc_key = (meta["file_path"], meta["start_line"], meta["end_line"])
        if loc_key in seen_locations:
            continue
        seen_locations.add(loc_key)

        raw_sim = max(0.0, min(1.0, r["score"]))

        # Keyword and symbol match
        keyword_score = 0.0
        symbol_score = 0.0

        meta_symbol = meta["symbol_name"].lower()
        meta_file = meta["file_path"].lower()
        meta_code = meta.get("code", "").lower()

        for term in query_terms:
            if term in meta_symbol:
                symbol_score += 0.20
            if term in meta_file:
                keyword_score += 0.15
            elif term in meta_code:
                keyword_score += 0.05

        # Calibrated score: semantic (70%) + keyword/symbol boosts (<= 30%)
        boosts = min(0.15, keyword_score) + min(0.15, symbol_score)
        final_score = min(1.0, (raw_sim * 0.70) + boosts)

        final_candidates.append({"score": final_score, "metadata": meta})

    final_candidates.sort(key=lambda x: x["score"], reverse=True)

    # Build context from top 5 unique candidates
    top_candidates = final_candidates[:5]

    context_blocks = []
    sources = []
    for i, c in enumerate(top_candidates):
        meta = c["metadata"]
        block = (
            f"SOURCE {i + 1}\n"
            f"File: {meta['file_path']}\n"
            f"Symbol: {meta['symbol_name']}\n"
            f"Lines: {meta['start_line']}-{meta['end_line']}\n\n"
            f"{meta['code']}\n"
        )
        context_blocks.append(block)
        sources.append(meta)

    top_score = top_candidates[0]["score"] if top_candidates else 0.0
    return "\n".join(context_blocks), sources, top_score


def ingest_units(units):
    if not units:
        return
    texts = []
    for u in units:
        u_info = f"File: {u['file_path']}\nSymbol: {u['symbol_name']}"
        texts.append(f"{u_info}\n\n{u['code']}")

    embs = generate_embeddings(texts)
    vector_store.add(embs, units)


def get_all_context_summary():
    if not vector_store.metadata:
        return ""
    files = {}
    for meta in vector_store.metadata.values():
        fp = meta["file_path"]
        if fp not in files:
            files[fp] = []
        files[fp].append(meta["symbol_name"])

    summary_lines = ["Repository Structure & Symbols:"]
    for fp, symbols in files.items():
        unique_symbols = list(dict.fromkeys(symbols))
        syms_str = ", ".join(unique_symbols[:8])
        summary_lines.append(f"- {fp} (contains: {syms_str})")
    return "\n".join(summary_lines)


def search_symbols(query: str):
    if not vector_store.metadata:
        return []
    q = query.lower()
    matches = []
    seen = set()
    for meta in vector_store.metadata.values():
        if q in meta["symbol_name"].lower() or q in meta["file_path"].lower():
            key = (meta["file_path"], meta["symbol_name"])
            if key not in seen:
                seen.add(key)
                matches.append(meta)
    return matches
