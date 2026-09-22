import os
from groq import Groq

class MockSegment:
    def __init__(self, start, end, text):
        self.start = start
        self.end = end
        self.text = text

class MockTranscription:
    def __init__(self):
        self.text = "所以我们要跟着炉上走。炉上哪个活急我们就干哪个。"
        self.segments = [
            MockSegment(0, 5, "所以我们要跟着炉上走。"),
            MockSegment(5, 10, "炉上哪个活急我们就干哪个。")
        ]

def transcribe_audio(audio_path: str):
    """
    Transcribes audio using Groq's Whisper API.
    Returns the transcription object which includes text and segments if supported.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key":
        print("No GROQ_API_KEY found, using mock transcription...")
        return MockTranscription()

    client = Groq(api_key=api_key)
    with open(audio_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=(audio_path, file.read()),
            model="whisper-large-v3",
            prompt="Berikut adalah rekaman campuran bahasa Indonesia dan Mandarin. 这是一个印尼语和中文的混合录音。请准确记录中文汉字 (Hanzi) 和印尼语。",
            response_format="verbose_json",
        )
        return transcription
