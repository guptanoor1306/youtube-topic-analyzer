from typing import Dict
import PyPDF2
from io import BytesIO


class PDFService:
    def parse_pdf(self, pdf_content: bytes) -> Dict:
        """Parse PDF and extract text content"""
        try:
            pdf_file = BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = []
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content.append(page.extract_text())
            
            full_text = "\n".join(text_content)
            
            return {
                "success": True,
                "num_pages": len(pdf_reader.pages),
                "content": full_text,
                "summary": full_text[:1000] + "..." if len(full_text) > 1000 else full_text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

