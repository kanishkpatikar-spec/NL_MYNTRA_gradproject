"""
Prompt builder — constructs the system and user prompts for the Groq
classification call, injecting the full taxonomy and enforcing the
required JSON output schema.
"""

from . import taxonomy


def build_system_prompt() -> str:
    """
    Return the system prompt that turns the LLM into a fashion-review
    analyst.  The taxonomy is injected dynamically so it stays in sync
    with taxonomy.json.
    """
    taxonomy_text = taxonomy.get_taxonomy_for_prompt()

    return f"""You are an expert fashion e-commerce analyst working for Myntra.
Your task is to classify user-generated snippets (reviews, comments, posts)
against the following taxonomy of **purchase-hesitation drivers**.

### TAXONOMY (v{taxonomy.get_version()})
{taxonomy_text}

### INSTRUCTIONS
For each snippet you receive, produce a JSON object with exactly these keys:

1. **tags** (array of strings): One or more driver IDs from the taxonomy above
   that the snippet expresses. Use the exact `id` values (e.g. "fit_size_uncertainty").
   Multi-label is allowed. If no driver fits, use ["wishlist_as_bookmark"].

2. **paraphrase** (string): A short, reworded summary of the snippet in 1–2
   sentences. This must NOT be a verbatim copy — rephrase the core concern
   in your own words.

3. **intensity** (integer 1–5): How strongly the snippet expresses the
   driver(s).
   - 1 = Passing mention, barely noticeable
   - 2 = Mild concern mentioned in passing
   - 3 = Clear, moderate concern
   - 4 = Strong frustration or hesitation
   - 5 = Extreme blocker — user explicitly says they will NOT buy

4. **segments** (array of strings): Any user segment signals you can infer.
   Examples: "student", "first-time buyer", "plus-size", "men's fashion",
   "budget shopper", "premium buyer". Return an empty array if no segment
   is clearly inferable.

5. **new_category** (string or null): If the snippet describes a hesitation
   driver that does NOT fit any of the 10 taxonomy categories above,
   propose a short label for the new category. Otherwise return null.

### OUTPUT FORMAT
Return ONLY a valid JSON object. No markdown, no backticks, no explanation.
Example:
{{"tags":["fit_size_uncertainty","return_exchange_friction"],"paraphrase":"User is unsure about sizing and worried about return hassle.","intensity":3,"segments":["plus-size"],"new_category":null}}
"""


def build_user_prompt(snippet_text: str, source: str = "") -> str:
    """
    Build the user-message prompt from the raw snippet text and optional
    source label.
    """
    source_hint = f" [Source: {source}]" if source else ""
    return f"Classify this snippet:{source_hint}\n\n{snippet_text}"
