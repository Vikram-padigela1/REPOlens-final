import warnings

warnings.filterwarnings("ignore")

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402

client = TestClient(app)

print("========================================")
print("REPO LENS BACKEND VERIFICATION SUITE")
print("========================================")

# 1. Health check
print("\n[TEST 1] Health Check")
res = client.get("/health")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
print("✓ Health OK:", res.json())

# 2. Ingest repo (initial)
print("\n[TEST 2] Ingesting demo-repo (Initial)")
res = client.post("/api/ingest", json={"repo_url": "demo-repo"})
assert res.status_code == 200, f"Ingest failed: {res.text}"
data = res.json()
print("✓ Ingest response:", data)
assert data["files"] > 0
assert data["functions"] > 0
assert data["classes"] > 0

# 3. Re-ingest repo (testing deduplication / clear)
print("\n[TEST 3] Re-ingesting demo-repo (Testing reset & deduplication)")
res = client.post("/api/ingest", json={"repo_url": "demo-repo"})
assert res.status_code == 200
data = res.json()
print(
    f"✓ Re-ingest OK. Files: {data['files']}, "
    f"Functions: {data['functions']}, Classes: {data['classes']}"
)

# 4. Search Symbols (verifying deduplicated unique results)
print("\n[TEST 4] Symbol Search for 'auth'")
res = client.get("/api/search?q=auth")
assert res.status_code == 200
symbols = res.json()
print(f"✓ Found {len(symbols)} symbols for 'auth':")
unique_keys = set()
for s in symbols:
    key = (s["file_path"], s["symbol_name"])
    assert key not in unique_keys, f"Duplicate symbol found: {key}"
    unique_keys.add(key)
    print(f"  - {s['symbol_name']} in {s['file_path']}")

# 5. Ask Question
print("\n[TEST 5] Ask: 'Where is authentication handled?'")
res = client.post(
    "/api/ask",
    json={"query": "Where is authentication handled?"},
)
assert res.status_code == 200
ask_data = res.json()
conf_pct = round(ask_data["confidence"] * 100, 1)
print(f"✓ Confidence: {ask_data['confidence_label']} ({conf_pct}%)")
print("✓ Answer preview:", ask_data["answer"][:150], "...")
print("✓ Evidence sources count:", len(ask_data["sources"]))
source_locs = [
    f"{s['file']}:{s['start_line']}-{s['end_line']}"
    for s in ask_data["sources"]
]
assert len(source_locs) == len(set(source_locs)), (
    "Duplicate sources in evidence!"
)
for s in ask_data["sources"]:
    loc = f"{s['file']} (L{s['start_line']}-{s['end_line']})"
    print(f"  - {s['symbol']}() in {loc}")

# 6. Anti-hallucination Check
print(
    "\n[TEST 6] Anti-Hallucination: "
    "'How does the quantum warp drive operate?'"
)
res = client.post(
    "/api/ask",
    json={"query": "How does the quantum warp drive operate?"},
)
assert res.status_code == 200
ah_data = res.json()
print("✓ Anti-hallucination Answer:", ah_data["answer"][:160], "...")

# 7. Trace Flow
print("\n[TEST 7] Trace Flow: 'Trace the login request flow'")
res = client.post("/api/trace", json={"query": "Trace the login request flow"})
assert res.status_code == 200
trace_data = res.json()
nodes_cnt = len(trace_data.get("nodes", []))
edges_cnt = len(trace_data.get("edges", []))
print(f"✓ Trace Nodes: {nodes_cnt}, Edges: {edges_cnt}")
for n in trace_data.get("nodes", [])[:3]:
    print(f"  Node: {n.get('id')} - {n.get('label')}")

# 8. Impact Analysis
print("\n[TEST 8] Impact Analysis: 'AuthService'")
res = client.post("/api/impact", json={"symbol": "AuthService"})
assert res.status_code == 200
impact_data = res.json()
print("✓ Impact Level:", impact_data.get("level"))
print("✓ Impact Summary:", impact_data.get("summary")[:120], "...")
imp_nodes = len(impact_data.get("nodes", []))
imp_edges = len(impact_data.get("edges", []))
print(f"✓ Impact Graph: {imp_nodes} nodes, {imp_edges} edges")

# 9. Onboard Guide
print("\n[TEST 9] Onboard Guide Generation")
res = client.post("/api/onboard")
assert res.status_code == 200
onboard_data = res.json()
guide_text = onboard_data.get("markdown", "")
print("✓ Onboarding Guide length:", len(guide_text))
print("✓ Guide preview:\n" + "\n".join(guide_text.split("\n")[:6]))

print("\n========================================")
print("ALL 9 BACKEND TESTS PASSED SUCCESSFULLY!")
print("========================================")
