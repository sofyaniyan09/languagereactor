import jieba
from pypinyin import pinyin, Style
import opencc

# Initialize OpenCC for Traditional to Simplified conversion
converter = opencc.OpenCC('t2s')

def normalize_text(text: str) -> str:
    """
    Converts Traditional Chinese to Simplified Chinese.
    """
    return converter.convert(text)

def segment_text(text: str) -> list:
    """
    Segments a Chinese sentence into words using Jieba.
    """
    # jieba.lcut returns a list of words
    return jieba.lcut(text)

def get_pinyin(text: str) -> str:
    """
    Generates Pinyin for a given Chinese text.
    Returns space-separated pinyin.
    """
    pinyin_list = pinyin(text, style=Style.TONE)
    # pinyin returns a list of lists, flatten it
    flattened = [item[0] for item in pinyin_list]
    return " ".join(flattened)

def process_sentence(sentence: str):
    """
    Processes a single sentence: normalizes, segments, and generates pinyin.
    Returns a dictionary with sentence details and word-level breakdown.
    """
    normalized_sentence = normalize_text(sentence)
    sentence_pinyin = get_pinyin(normalized_sentence)
    
    words = segment_text(normalized_sentence)
    word_details = []
    
    for word in words:
        # Ignore punctuation/empty strings if needed, but keeping it simple for now
        if word.strip():
            word_pinyin = get_pinyin(word)
            word_details.append({
                "hanzi": word,
                "pinyin": word_pinyin,
                # Meaning will be filled by LLM later
                "meaning": "" 
            })
            
    return {
        "hanzi": normalized_sentence,
        "pinyin": sentence_pinyin,
        "words": word_details
    }
