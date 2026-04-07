async def extract_text_from_txt(file_bytes: bytes) -> str:
    """
    Decode a plain-text file supplied as raw bytes.

    Tries UTF-8 first (covers ~99 % of cases), then falls back to
    latin-1 which can decode every possible byte value without error.
    """
    try:
        return file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        try:
            return file_bytes.decode("latin-1").strip()
        except Exception as e:
            raise ValueError(f"Failed to decode text file: {e}")
