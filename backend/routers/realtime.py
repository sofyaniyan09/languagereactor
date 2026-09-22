import os
import tempfile
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydub import AudioSegment
import io

from services.transcriber import transcribe_audio
from services.sentence_judge import is_sentence_complete
from services.text_processor import process_sentence
from services.llm_translator import translate_and_enrich_sentence

router = APIRouter()

@router.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connected")
    
    # Session state
    accumulated_audio = AudioSegment.empty()
    
    try:
        while True:
            # Receive audio chunk (bytes) from client
            data = await websocket.receive_bytes()
            print(f"[WebSocket] Received chunk of {len(data)} bytes")
            
            try:
                # 1. Decode the chunk (WebM/MP4 from browser)
                chunk_audio = AudioSegment.from_file(io.BytesIO(data))
                
                # 2. Append to accumulated buffer
                accumulated_audio += chunk_audio
                
                # 3. Export combined audio to a temporary WAV file for Whisper
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
                    accumulated_audio.export(tmp_wav.name, format="wav")
                    tmp_wav_path = tmp_wav.name
                
                # 4. Transcribe the accumulated audio
                # Note: transcribe_audio is sync, in production we should run in threadpool
                # but for hobby usage asyncio.to_thread is good
                transcription = await asyncio.to_thread(transcribe_audio, tmp_wav_path)
                
                os.remove(tmp_wav_path)
                
                # Extract text
                if hasattr(transcription, 'text'):
                    current_text = transcription.text.strip()
                elif isinstance(transcription, dict) and 'text' in transcription:
                    current_text = transcription['text'].strip()
                else:
                    current_text = ""
                    
                print(f"[RealTime] Current transcript: {current_text}")
                
                # Send intermediate transcript to client
                await websocket.send_json({
                    "type": "transcript_update",
                    "text": current_text
                })
                
                # 5. Check semantic completeness
                is_complete = await asyncio.to_thread(is_sentence_complete, current_text)
                
                if is_complete:
                    print(f"[RealTime] Sentence COMPLETE: {current_text}")
                    # Process and translate
                    sentence_data = process_sentence(current_text)
                    sentence_data["id"] = 1 # Single sentence mode
                    final_data = await asyncio.to_thread(translate_and_enrich_sentence, sentence_data, "")
                    
                    # Send final result
                    await websocket.send_json({
                        "type": "sentence_complete",
                        "data": final_data
                    })
                    
                    # Reset buffer for the next sentence!
                    accumulated_audio = AudioSegment.empty()
                    
            except Exception as e:
                print(f"[WebSocket Processing Error] {e}")
                
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
