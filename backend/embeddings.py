from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np


class EmbeddingGenerator:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([])

        embeddings = self.model.encode(texts, show_progress_bar=False)
        return np.array(embeddings).astype('float32')

    def generate_query_embedding(self, query: str) -> np.ndarray:
        embedding = self.model.encode([query], show_progress_bar=False)
        return np.array(embedding).astype('float32')[0]

    def get_embedding_dimension(self) -> int:
        return self.embedding_dim