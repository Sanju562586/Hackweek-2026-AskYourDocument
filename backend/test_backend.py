import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from document_processor import DocumentProcessor
from embeddings import EmbeddingGenerator
from vector_store import VectorStore
from rag_pipeline import RAGPipeline
import tempfile


def test_document_processor():
    print("Testing Document Processor...")
    processor = DocumentProcessor(chunk_size=100, chunk_overlap=20)

    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("This is a test document. " * 50)
        temp_file = f.name

    try:
        chunks = processor.process_document(temp_file, 'txt')
        assert len(chunks) > 0, "Should generate chunks"
        assert all(len(chunk) > 50 for chunk in chunks), "All chunks should be meaningful"
        print("  Document Processor: PASSED")
        return True
    except Exception as e:
        print(f"  Document Processor: FAILED - {e}")
        return False
    finally:
        os.unlink(temp_file)


def test_embeddings():
    print("Testing Embedding Generator...")
    try:
        generator = EmbeddingGenerator()
        texts = ["Hello world", "Test document", "AI and machine learning"]
        embeddings = generator.generate_embeddings(texts)

        assert embeddings.shape[0] == 3, "Should generate 3 embeddings"
        assert embeddings.shape[1] == generator.embedding_dim, "Embedding dimension should match"
        print("  Embedding Generator: PASSED")
        return True
    except Exception as e:
        print(f"  Embedding Generator: FAILED - {e}")
        return False


def test_vector_store():
    print("Testing Vector Store...")
    try:
        store = VectorStore(persist_directory="./test_chroma_db")

        import numpy as np
        test_chunks = ["Test chunk 1", "Test chunk 2", "Test chunk 3"]
        test_embeddings = np.random.rand(3, 384).astype('float32')
        test_metadata = {"document_id": "test123", "filename": "test.txt"}

        chunk_ids = store.add_documents(test_chunks, test_embeddings, test_metadata)
        assert len(chunk_ids) == 3, "Should return 3 chunk IDs"

        query_embedding = np.random.rand(384).astype('float32')
        results = store.search(query_embedding, top_k=2)
        assert len(results["documents"]) <= 2, "Should return at most 2 results"

        store.clear_all()
        print("  Vector Store: PASSED")
        return True
    except Exception as e:
        print(f"  Vector Store: FAILED - {e}")
        return False


def test_rag_pipeline():
    print("Testing RAG Pipeline...")
    try:
        pipeline = RAGPipeline()

        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("Artificial Intelligence is transforming the world. " * 20)
            temp_file = f.name

        try:
            import asyncio
            result = asyncio.run(pipeline.process_and_store_document(temp_file, 'test.txt', 'txt'))
            assert result['status'] == 'processed', "Document should be processed"
            assert result['chunk_count'] > 0, "Should have chunks"

            query_result = pipeline.query("What is artificial intelligence?")
            assert 'answer' in query_result, "Should have answer"
            assert 'sources' in query_result, "Should have sources"

            pipeline.clear_all_documents()
            print("  RAG Pipeline: PASSED")
            return True
        finally:
            os.unlink(temp_file)
    except Exception as e:
        print(f"  RAG Pipeline: FAILED - {e}")
        return False


def main():
    print("=" * 50)
    print("Running Backend Tests")
    print("=" * 50)
    print()

    results = []
    results.append(test_document_processor())
    results.append(test_embeddings())
    results.append(test_vector_store())
    results.append(test_rag_pipeline())

    print()
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Tests Passed: {passed}/{total}")

    if passed == total:
        print("All tests PASSED!")
        print("=" * 50)
        return 0
    else:
        print(f"{total - passed} test(s) FAILED")
        print("=" * 50)
        return 1


if __name__ == "__main__":
    sys.exit(main())