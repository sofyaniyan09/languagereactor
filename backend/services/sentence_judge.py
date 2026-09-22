import os
from groq import Groq

def is_sentence_complete(text: str) -> bool:
    """
    Uses Groq LLM (Llama 3 or Qwen) to judge if the accumulated text
    is a semantically complete Mandarin sentence.
    Returns True if complete, False otherwise.
    """
    if not text or len(text.strip()) < 2:
        return False
        
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key":
        # Fallback heuristic if no API key: check for punctuation
        return any(punct in text for punct in ["。", "？", "！", ".", "?", "!"])
        
    client = Groq(api_key=api_key)
    
    prompt = f"""You are an expert Mandarin linguist. Read the following Mandarin text and determine if it forms a grammatically and semantically complete sentence.

Text: "{text}"

Answer ONLY with the word "YES" if it is complete (it has a full thought, e.g., subject-verb-object, or represents a complete statement/question). 
Answer ONLY with the word "NO" if it is incomplete (e.g., just a subject, dangling modifier, cut off mid-thought, hesitations).

Do not explain. Just YES or NO."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Fast model for quick judgement
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2,
        )
        answer = completion.choices[0].message.content.strip().upper()
        return "YES" in answer
    except Exception as e:
        print(f"[Judge Error] {e}")
        # Fallback heuristic
        return any(punct in text for punct in ["。", "？", "！", ".", "?", "!"])
