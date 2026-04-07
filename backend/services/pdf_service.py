import fitz  # PyMuPDF


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF supplied as raw bytes.
    Uses PyMuPDF (fitz) — no temp files needed.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pages.append(page.get_text("text"))
        doc.close()
        return "\n".join(pages).strip()
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {e}")
