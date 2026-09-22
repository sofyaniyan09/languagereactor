from services.audio_extractor import extract_audio
from services.transcriber import transcribe_audio
from services.text_processor import process_sentence
from services.llm_translator import translate_and_enrich_sentence
from services.supabase_client import supabase
import os

def update_status(task_id: str, status: str, tasks_db: dict, error: str = None, result: dict = None):
    tasks_db[task_id]["status"] = status
    if error:
        tasks_db[task_id]["error"] = error
    if result:
        tasks_db[task_id]["result"] = result
        
    if supabase:
        update_data = {"status": status}
        if error:
            update_data["error"] = error
        if result:
            update_data["result"] = result
        try:
            supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        except Exception as e:
            print(f"Supabase update error: {e}")

def run_pipeline(task_id: str, file_path: str, tasks_db: dict):
    """
    Main background job to process the uploaded file.
    Updates tasks_db at each step.
    """
    try:
        # Step 1: Audio Extraction (convert to 16kHz wav)
        update_status(task_id, "extracting_audio", tasks_db)
        wav_path = f"temp/{task_id}/audio.wav"
        extract_audio(file_path, wav_path)
        
        # Step 2: Transcription
        update_status(task_id, "transcribing", tasks_db)
        transcription_result = transcribe_audio(wav_path)
        
        # Step 3: NLP & Translation
        update_status(task_id, "processing_nlp", tasks_db)
        
        # Groq returns a verbose JSON with segments (start, end, text)
        segments = transcription_result.segments
        
        # Build full transcript for context
        full_context = " ".join([seg.text if hasattr(seg, 'text') else seg['text'] for seg in segments])
        
        processed_sentences = []
        for i, segment in enumerate(segments):
            # Support both dict-style and attribute-style segments
            text = segment.text if hasattr(segment, 'text') else segment['text']
            start = segment.start if hasattr(segment, 'start') else segment['start']
            end = segment.end if hasattr(segment, 'end') else segment['end']
            
            # Text Processing (OpenCC -> Jieba -> Pinyin)
            sentence_data = process_sentence(text)
            sentence_data["id"] = i + 1
            sentence_data["audio_start"] = start
            sentence_data["audio_end"] = end
            
            # LLM Translation with context
            sentence_data = translate_and_enrich_sentence(sentence_data, full_context)
            
            processed_sentences.append(sentence_data)
            
        # Step 4: Finished
        media_url = f"/media/{task_id}/audio.wav" # fallback local url
        
        # If supabase is configured, upload the audio file to the 'media' bucket
        if supabase:
            try:
                storage_path = f"{task_id}/audio.wav"
                with open(wav_path, "rb") as f:
                    supabase.storage.from_("media").upload(storage_path, f.read())
                media_url = supabase.storage.from_("media").get_public_url(storage_path)
            except Exception as e:
                print(f"Failed to upload audio to Supabase Storage: {e}")
        
        result_payload = {
            "status": "completed",
            "mediaUrl": media_url, 
            "sentences": processed_sentences
        }
        
        update_status(task_id, "completed", tasks_db, result=result_payload)
        
    except Exception as e:
        update_status(task_id, "failed", tasks_db, error=str(e))
        print(f"Pipeline failed for task {task_id}: {e}")
    finally:
        # Cleanup original upload if needed
        # We can keep wav_path for playback, but in real app we upload to bucket
        pass
