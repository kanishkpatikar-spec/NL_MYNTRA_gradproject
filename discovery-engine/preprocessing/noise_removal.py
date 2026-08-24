import re

def noise_removal(snippets: list) -> list:
    """Removes too-short snippets, spam, and normalizes text."""
    clean = []
    
    # Regex to catch simple 1-2 word reviews like "Good app", "5 stars", "nice"
    rating_only_pattern = re.compile(r'^\s*(good|nice|awesome|bad|terrible|love it|5 stars|worst).{0,10}$', re.IGNORECASE)
    
    for snippet in snippets:
        text = snippet.get('text', '')
        
        # Remove too short
        if len(text.strip()) < 15:
            continue
            
        # Remove pure rating reviews
        if rating_only_pattern.match(text):
            continue
            
        # Basic normalization: strip excessive whitespace and newlines
        text = re.sub(r'\n+', '\n', text)
        text = re.sub(r'\s{2,}', ' ', text)
        text = text.strip()
        
        # We don't lowercase here because the LLM might benefit from capitalization for sentiment,
        # but we do clean up the noise.
        snippet['text'] = text
        clean.append(snippet)
        
    return clean
