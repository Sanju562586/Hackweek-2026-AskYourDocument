from typing import List, Dict, Optional
from document_processor import DocumentProcessor
from embeddings import EmbeddingGenerator
from vector_store import VectorStore
from llm_service import LLMService
from datetime import datetime
import os
import aiofiles
from dotenv import load_dotenv

load_dotenv()


class RAGPipeline:
    def __init__(self):
        self.document_processor = DocumentProcessor(
            chunk_size=int(os.getenv("CHUNK_SIZE", 1000)),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", 200))
        )
        self.embedding_generator = EmbeddingGenerator()
        self.vector_store = VectorStore()
        self.top_k = int(os.getenv("TOP_K", 5))
        self.llm_service = LLMService(provider=os.getenv("LLM_PROVIDER", "openai"))
        self._total_queries = 0

    async def process_and_store_document(self, file_path: str, filename: str, file_type: str) -> Dict:
        chunks = self.document_processor.process_document(file_path, file_type)

        if not chunks:
            raise ValueError("No text could be extracted from the document")

        embeddings = self.embedding_generator.generate_embeddings(chunks)

        document_id = str(hash(filename + str(datetime.now())))
        metadata = {
            "document_id": document_id,
            "filename": filename,
            "file_type": file_type,
            "upload_time": datetime.now().isoformat(),
            "chunk_count": len(chunks)
        }

        chunk_ids = self.vector_store.add_documents(chunks, embeddings, metadata)

        return {
            "document_id": document_id,
            "filename": filename,
            "file_type": file_type,
            "chunk_count": len(chunks),
            "upload_time": metadata["upload_time"],
            "status": "processed"
        }

    def query(self, question: str) -> Dict:
        self._total_queries += 1
        query_embedding = self.embedding_generator.generate_query_embedding(question)
        search_results = self.vector_store.search(query_embedding, top_k=self.top_k)

        if not search_results["documents"]:
            return {
                "answer": "I couldn't find any relevant information in the uploaded documents to answer your question.",
                "sources": [],
                "confidence": 0.0
            }

        context = "\n\n".join(search_results["documents"])
        sources = [
            {
                "text": doc[:300] + "..." if len(doc) > 300 else doc,
                "metadata": meta
            }
            for doc, meta in zip(search_results["documents"], search_results["metadatas"])
        ]

        answer = self._generate_answer(question, context)

        avg_distance = sum(search_results["distances"]) / len(search_results["distances"])
        confidence = max(0.0, min(1.0, 1.0 - avg_distance))

        return {
            "answer": answer,
            "sources": sources,
            "confidence": round(confidence, 2)
        }

    def _generate_answer(self, question: str, context: str) -> str:
        prompt = f"""You are a helpful assistant that answers questions based on the provided context from documents.

Context from documents:
{context}

Question: {question}

Instructions:
- Answer the question based ONLY on the information provided in the context above
- If the context doesn't contain enough information to answer the question, say so clearly
- Provide a clear, concise, and accurate answer
- Do not make up information or use knowledge outside the provided context
- If relevant, quote specific parts from the context to support your answer

Answer:"""

        try:
            return self.llm_service.generate_response(prompt, max_tokens=512, temperature=0.3)
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def get_documents(self) -> List[Dict]:
        return self.vector_store.get_all_documents()

    def delete_document(self, document_id: str) -> bool:
        try:
            self.vector_store.delete_by_document_id(document_id)
            return True
        except Exception:
            return False

    def clear_all_documents(self):
        self.vector_store.clear_all()
        self._total_queries = 0

    def get_stats(self) -> Dict:
        documents = self.get_documents()
        total_chunks = sum(doc.get("chunk_count", 0) for doc in documents)
        return {
            "document_count": len(documents),
            "total_chunks": total_chunks,
            "total_queries": self._total_queries,
            "provider": self.llm_service.get_provider_name()
        }