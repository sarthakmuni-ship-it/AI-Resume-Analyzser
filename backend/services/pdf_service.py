import fitz  # PyMuPDF

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file provided as raw bytes.
    """
    try:
        # Open the PDF directly from the memory stream (no need to save to disk first)
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        extracted_text = ""
        # Loop through every page and pull the text
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            extracted_text += page.get_text("text") + "\n"
            
        doc.close()
        
        # Return the cleaned up text
        return extracted_text.strip()
        
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")