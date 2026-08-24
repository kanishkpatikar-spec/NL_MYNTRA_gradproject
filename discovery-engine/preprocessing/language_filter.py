import langdetect
from langdetect import DetectorFactory

# Enforce consistent results
DetectorFactory.seed = 0

def language_filter(snippets: list) -> list:
    """Filters snippets, keeping only English or mixed content."""
    filtered = []
    
    for snippet in snippets:
        text = snippet.get('text', '')
        
        # Very short texts might fail detection, keep them by default
        if len(text.strip()) < 15:
            filtered.append(snippet)
            continue
            
        try:
            lang = langdetect.detect(text)
            # We keep 'en' (English), and potentially 'hi' (Hindi/Hinglish)
            # langdetect can sometimes be confused by Hinglish, so we're lenient
            # For this MVP, if it detects some common European or Indian languages we'll let it pass
            # but ideally we only want 'en' and 'hi'
            if lang in ['en', 'hi', 'id', 'tl', 'cy', 'nl', 'af']: # Include languages often confused with Hinglish
                filtered.append(snippet)
        except langdetect.lang_detect_exception.LangDetectException:
            # If detection fails, keep it to be safe
            filtered.append(snippet)
            
    return filtered
