import fitz  # PyMuPDF
import re

# Marker we embed invisibly in every exported ATS report (see exportPdf.js)
ATS_REPORT_MARKER = "%%ATS_AUDIT_REPORT%%"

# Phrases that appear in the report header — if we see these at the top
# of a PDF it means the user re-uploaded their exported report, not their resume
REPORT_HEADER_PHRASES = [
    "Resume ATS Audit Report",
    "ATS Compatibility",
    "Matched Keywords",
    "Missing Keywords",
    "Expert Feedback",
    "AI Suggested Rewrites",
    "ORIGINAL",
    "AI REWRITE",
    "Powered by Groq AI",
    "ATS SCORE",
]


def _is_ats_report(text: str) -> bool:
    """
    Returns True if the extracted text looks like one of our own exported
    ATS report PDFs rather than a real resume.

    We check for:
      1. The invisible marker string we embed in every export.
      2. A high density of our own report section headings in the first 600 chars.
    """
    # Explicit hidden marker — fastest check
    if ATS_REPORT_MARKER in text:
        return True

    # Heuristic: count how many of our report phrases appear in the first 600 chars
    preview = text[:600]
    hits = sum(1 for phrase in REPORT_HEADER_PHRASES if phrase in preview)
    # 3 or more matches in the opening text = almost certainly our report
    return hits >= 3


def _clean_text(text: str) -> str:
    """
    Light cleanup:
      - Collapse runs of whitespace / blank lines
      - Remove page-number footers like "Page 1 of 3"
      - Strip the confidential footer we add to every report page
    """
    # Remove our own footer lines
    text = re.sub(r"Resume ATS Audit — Confidential\s*", "", text)
    text = re.sub(r"Page \d+ of \d+\s*", "", text)

    # Collapse 3+ blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts plain text from a PDF supplied as raw bytes.

    Raises a descriptive ValueError when:
      • The PDF cannot be opened / parsed.
      • No text can be extracted (scanned / image-only PDF).
      • The PDF is one of our own exported ATS Audit Reports — the user
        must upload their *resume* PDF, not the downloaded report.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        pages_text = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pages_text.append(page.get_text("text"))

        doc.close()
        raw_text = "\n".join(pages_text)

    except Exception as e:
        raise ValueError(f"Failed to open or read the PDF: {e}")

    # ── Guard: empty / image-only PDF ────────────────────────────────────────
    cleaned = _clean_text(raw_text)
    if not cleaned:
        raise ValueError(
            "No text could be extracted from this PDF. "
            "If it is a scanned document, please copy-paste the text manually "
            "using the 'paste text' option instead."
        )

    # ── Guard: user uploaded our own exported report ──────────────────────────
    if _is_ats_report(cleaned):
        raise ValueError(
            "This file appears to be an exported ATS Audit Report, not a resume. "
            "Please upload your original resume PDF (or TXT) file. "
            "The downloaded report is for your records only — it cannot be re-analyzed."
        )

    return cleaned