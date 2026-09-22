import shutil

def extract_audio(input_path: str, output_path: str) -> str:
    """
    Extracts audio from video or converts audio to 16kHz mono WAV for Whisper.
    MOCKED: Just copies the input file to output_path because ffmpeg is missing.
    """
    try:
        shutil.copyfile(input_path, output_path)
        return output_path
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        raise e
