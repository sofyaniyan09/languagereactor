import os
import json
from groq import Groq

def translate_and_enrich_sentence(sentence_data: dict, full_context: str = "") -> dict:
    """
    Uses Groq's LLaMA model to translate Mandarin sentence and each word to Indonesian.
    Falls back to Gemini if Groq key is not available.
    """
    groq_key = os.environ.get("GROQ_API_KEY")

    if groq_key and groq_key != "your_groq_api_key":
        return _translate_with_groq(sentence_data, groq_key, full_context)

    # Fallback: Gemini via OpenAI-compatible endpoint
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key and gemini_key != "your_gemini_api_key":
        return _translate_with_gemini(sentence_data, gemini_key, full_context)

    # No API key available
    print("No translation API key found, using mock translation...")
    sentence_data["translation"] = "(Tambahkan GROQ_API_KEY atau GEMINI_API_KEY di .env)"
    for word in sentence_data["words"]:
        word["meaning"] = "?"
    return sentence_data


def _translate_with_groq(sentence_data: dict, api_key: str, full_context: str) -> dict:
    client = Groq(api_key=api_key)

    prompt = f"""You are an expert Mandarin teacher. Translate this Mandarin sentence and each word to Indonesian (Bahasa Indonesia).

Full Video Context (for reference):
{full_context}

Target Sentence to Translate: {sentence_data['hanzi']}
Words: {[w['hanzi'] for w in sentence_data['words']]}

Respond ONLY in valid JSON format like this:
{{
  "sentence_translation": "terjemahan kalimat lengkap di sini",
  "word_meanings": ["arti kata 1", "arti kata 2", ...]
}}

The word_meanings array must have exactly {len(sentence_data['words'])} items, one per word, in the same order."""

    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result_str = completion.choices[0].message.content
        result_json = json.loads(result_str)

        sentence_data["translation"] = result_json.get("sentence_translation", "")
        meanings = result_json.get("word_meanings", [])
        for i, word in enumerate(sentence_data["words"]):
            if i < len(meanings):
                word["meaning"] = meanings[i]

        print(f"Groq translation success: {sentence_data['translation'][:50]}")
        return sentence_data

    except Exception as e:
        print(f"Groq translation error: {e}")
        sentence_data["translation"] = "Translation failed."
        return sentence_data


def _translate_with_gemini(sentence_data: dict, api_key: str, full_context: str) -> dict:
    from openai import OpenAI

    client = OpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

    prompt = f"""You are an expert Mandarin teacher. Translate this Mandarin sentence and each word to Indonesian (Bahasa Indonesia).

Full Video Context (for reference):
{full_context}

Target Sentence to Translate: {sentence_data['hanzi']}
Words: {[w['hanzi'] for w in sentence_data['words']]}

Respond ONLY in valid JSON:
{{
  "sentence_translation": "...",
  "word_meanings": ["meaning1", "meaning2", ...]
}}"""

    try:
        for model in ["gemini-1.5-flash", "gemini-3.6-flash"]:
            try:
                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                result_json = json.loads(completion.choices[0].message.content)
                sentence_data["translation"] = result_json.get("sentence_translation", "")
                meanings = result_json.get("word_meanings", [])
                for i, word in enumerate(sentence_data["words"]):
                    if i < len(meanings):
                        word["meaning"] = meanings[i]
                print(f"Gemini ({model}) translation success")
                return sentence_data
            except Exception as model_err:
                print(f"Gemini {model} error: {model_err}, trying next...")
                continue

    except Exception as e:
        print(f"Gemini translation error: {e}")

    sentence_data["translation"] = "Translation failed."
    return sentence_data
