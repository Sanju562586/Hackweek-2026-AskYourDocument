import chromadb
from chromadb.config import Settings
from typing import List, Dict, Optional
import uuid


class VectorStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(self, chunks: List[str], embeddings, metadata: Dict) -> List[str]:
        chunk_ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [metadata for _ in chunks]

        self.collection.add(
            documents=chunks,
            embeddings=embeddings.tolist(),
            metadatas=metadatas,
            ids=chunk_ids
        )

        return chunk_ids

    def search(self, query_embedding, top_k: int = 5) -> Dict:
        results = self.collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        return {
            "documents": results["documents"][0] if results["documents"] else [],
            "metadatas": results["metadatas"][0] if results["metadatas"] else [],
            "distances": results["distances"][0] if results["distances"] else []
        }

    def delete_by_document_id(self, document_id: str):
        self.collection.delete(
            where={"document_id": document_id}
        )

    def get_all_documents(self) -> List[Dict]:
        try:
            results = self.collection.get(
                include=["metadatas"]
            )

            documents = {}
            
            metadatas = results.get("metadatas", [])
            if not metadatas:
                return []
            
            for metadata in metadatas:
                if not metadata:
                    continue
                doc_id = metadata.get("document_id")
                if doc_id and doc_id not in documents:
                    documents[doc_id] = {
                        "document_id": doc_id,
                        "filename": metadata.get("filename"),
                        "file_type": metadata.get("file_type"),
                        "upload_time": metadata.get("upload_time"),
                        "chunk_count": metadata.get("chunk_count", 0),
                        "status": metadata.get("status", "processed")
                    }

            return list(documents.values())
        except Exception as e:
            print(f"Error getting documents: {e}")
            return []

    def clear_all(self):
        self.client.delete_collection("documents")
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )