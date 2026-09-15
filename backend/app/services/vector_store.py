import os
import pickle
from pathlib import Path
from typing import Any

# pyrefly: ignore [missing-import]
import faiss

# pyrefly: ignore [missing-import]
import numpy as np


class VectorStore:
    def __init__(
        self,
        dimension: int = 3072,
        index_path: str | None = None,
        meta_path: str | None = None,
    ) -> None:
        base_dir = Path(__file__).resolve().parents[2] / "data"
        base_dir.mkdir(parents=True, exist_ok=True)
        self.dimension = dimension
        self.index_path: str = str(index_path or (base_dir / "faiss_index.bin"))
        self.meta_path: str = str(meta_path or (base_dir / "metadata.pkl"))
        # Inner product for cosine similarity if normalized
        self.index: Any = faiss.IndexFlatIP(dimension)
        self.metadata: dict[int, dict[str, Any]] = {}
        self._next_id: int = 0

    def add(
        self,
        embeddings: list[list[float]],
        metadata_list: list[dict[str, Any]],
    ) -> None:
        if not embeddings:
            return

        # Normalize embeddings for cosine similarity
        emb_matrix = np.array(embeddings, dtype=np.float32)
        faiss.normalize_L2(emb_matrix)

        ids = np.arange(self._next_id, self._next_id + len(embeddings))

        # Use IndexIDMap to assign custom IDs
        if not isinstance(self.index, faiss.IndexIDMap):
            self.index = faiss.IndexIDMap(self.index)

        self.index.add_with_ids(emb_matrix, ids)

        for i, meta in zip(ids, metadata_list):
            self.metadata[int(i)] = meta

        self._next_id += len(embeddings)
        self.save()

    def search(
        self, query_embedding: list[float], k: int = 5
    ) -> list[dict[str, Any]]:
        if self._next_id == 0:
            return []

        q_matrix = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(q_matrix)

        distances, indices = self.index.search(q_matrix, k)

        results: list[dict[str, Any]] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                results.append(
                    {
                        "score": float(dist),
                        "metadata": self.metadata[int(idx)],
                    }
                )
        return results

    def clear(self) -> None:
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = {}
        self._next_id = 0
        if os.path.exists(self.index_path):
            try:
                os.remove(self.index_path)
            except OSError:
                pass
        if os.path.exists(self.meta_path):
            try:
                os.remove(self.meta_path)
            except OSError:
                pass

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "wb") as f:
            pickle.dump(
                {"metadata": self.metadata, "next_id": self._next_id},
                f,
            )

    def load(self) -> None:
        if os.path.exists(self.index_path) and os.path.exists(self.meta_path):
            self.index = faiss.read_index(self.index_path)
            with open(self.meta_path, "rb") as f:
                data = pickle.load(f)
                self.metadata = data["metadata"]
                self._next_id = data["next_id"]
