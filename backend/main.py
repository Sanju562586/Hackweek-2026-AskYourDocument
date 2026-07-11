from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from datetime import datetime
from rag_pipeline import RAGPipeline
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Ask Your Documents API",
    description="AI-powered document question answering system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_pipeline = None

@app.on_event("startup")
async def startup_event():
    global rag_pipeline
    rag_pipeline = RAGPipeline()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    confidence: float


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    file_type: str
    chunk_count: int
    upload_time: str
    status: str


class StatsResponse(BaseModel):
    document_count: int
    total_chunks: int
    total_queries: int
    provider: str


@app.get("/")
async def root():
    return {"message": "Ask Your Documents API", "status": "running"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    try:
        stats = rag_pipeline.get_stats()
        return StatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_extension = file.filename.split('.')[-1].lower()
    allowed_extensions = ['pdf', 'txt', 'docx', 'doc']

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )

    file_path = os.path.join(UPLOAD_DIR, f"{datetime.now().timestamp()}_{file.filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        result = await rag_pipeline.process_and_store_document(
            file_path=file_path,
            filename=file.filename,
            file_type=file_extension
        )

        os.remove(file_path)

        return DocumentResponse(**result)

    except ValueError as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/api/load-sample/{filename}", response_model=DocumentResponse)
async def load_sample_document(filename: str):
    allowed_samples = ['git_cheat_sheet.txt', 'python_zen.txt', 'markdown_spec.txt']
    if filename not in allowed_samples:
        raise HTTPException(status_code=400, detail="Invalid sample file")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "sample_documents", filename)

    if not os.path.exists(file_path):
        file_path = os.path.join("sample_documents", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Sample file not found")

    try:
        result = await rag_pipeline.process_and_store_document(
            file_path=file_path,
            filename=filename,
            file_type="txt"
        )
        return DocumentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing sample document: {str(e)}")


@app.post("/api/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        result = rag_pipeline.query(request.question)
        return QueryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.get("/api/documents", response_model=List[DocumentResponse])
async def get_documents():
    try:
        documents = rag_pipeline.get_documents()
        return [DocumentResponse(**doc) for doc in documents]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    try:
        success = rag_pipeline.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully", "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@app.delete("/api/documents")
async def clear_all_documents():
    try:
        rag_pipeline.clear_all_documents()
        return {"message": "All documents cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing documents: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)