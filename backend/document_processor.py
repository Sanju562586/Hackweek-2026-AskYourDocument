import pdfplumber
import docx2txt
from typing import List, Tuple
import re


class DocumentProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def extract_text(self, file_path: str, file_type: str) -> str:
        if file_type.lower() == 'pdf':
            return self._extract_pdf_text(file_path)
        elif file_type.lower() in ['docx', 'doc']:
            return self._extract_docx_text(file_path)
        elif file_type.lower() == 'txt':
            return self._extract_txt_text(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_pdf_text(self, file_path: str) -> str:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    def _extract_docx_text(self, file_path: str) -> str:
        return docx2txt.process(file_path).strip()

    def _extract_txt_text(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()

    def chunk_text(self, text: str) -> List[str]:
        if not text:
            return []

        text = self._clean_text(text)
        chunks = []
        start = 0
        text_length = len(text)

        while start < text_length:
            end = start + self.chunk_size
            chunk = text[start:end]

            if end < text_length:
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)

                if break_point > self.chunk_size * 0.5:
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1

            chunks.append(chunk.strip())
            start = end - self.chunk_overlap

        return [chunk for chunk in chunks if len(chunk) > 50]

    def _clean_text(self, text: str) -> str:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'[^\x00-\x7F]+', ' ', text)
        return text.strip()

    def process_document(self, file_path: str, file_type: str) -> List[str]:
        text = self.extract_text(file_path, file_type)
        return self.chunk_text(text)