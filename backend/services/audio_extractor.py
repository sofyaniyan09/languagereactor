import subprocess

def extract_audio(input_path: str, output_path: str) -> str:
    """
    Extracts audio from video or converts audio to 16kHz mono WAV for Whisper.
    """
    print(f"Extracting audio from {input_path} to {output_path} using ffmpeg...")
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, "-ac", "1", "-ar", "16000", "-vn", output_path
        ], check=True, capture_output=True)
        print(f"Extraction successful: {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        error_msg = f"Extraction error: {e.stderr.decode()}"
        print(error_msg)
        raise Exception(error_msg)
