import json
from pathlib import Path

from pypdf import PdfReader


DATA_DIR = Path(__file__).resolve().parent / "data"
LINKEDIN_PATH = DATA_DIR / "linkedin.pdf"


def read_linkedin_profile() -> str:
    """Return extracted LinkedIn profile text when the source PDF is available."""
    if not LINKEDIN_PATH.exists():
        return "LinkedIn profile not available."

    try:
        reader = PdfReader(LINKEDIN_PATH)
        return "\n".join(
            page_text
            for page in reader.pages
            if (page_text := page.extract_text())
        )
    except Exception:
        return "LinkedIn profile could not be read."


linkedin = read_linkedin_profile()
summary = (DATA_DIR / "summary.txt").read_text(encoding="utf-8")
style = (DATA_DIR / "style.txt").read_text(encoding="utf-8")
facts = json.loads((DATA_DIR / "facts.json").read_text(encoding="utf-8"))
