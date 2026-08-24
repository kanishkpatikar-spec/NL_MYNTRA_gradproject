import hashlib
import re

def normalize_for_hash(text: str) -> str:
    """Lowercases and normalizes whitespace for hashing to catch exact duplicates."""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def dedup(snippets: list) -> list:
    """Removes exact duplicates from a list of snippets based on their text."""
    seen_hashes = set()
    deduped = []
    
    for snippet in snippets:
        text = snippet.get('text', '')
        normalized = normalize_for_hash(text)
        text_hash = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
        
        if text_hash not in seen_hashes:
            seen_hashes.add(text_hash)
            deduped.append(snippet)
            
    return deduped
