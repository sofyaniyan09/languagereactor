from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
import uuid
import os
import shutil
from services.pipeline import run_pipeline
from services.supabase_client import supabase

router = APIRouter()

# In-memory database for tasks (always used as primary source)
tasks_db = {}

@router.post("/api/process")
async def process_media(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.content_type.startswith("video/") and not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be video or audio")

    task_id = str(uuid.uuid4())
    
    # Save file temporarily
    temp_dir = f"temp/{task_id}"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Register task in memory ALWAYS
    task_record = {
        "id": task_id,
        "status": "queued",
        "progress": 0,
        "result": None,
        "error": None
    }
    tasks_db[task_id] = task_record
    print(f"[TASK {task_id}] Registered in memory. tasks_db size: {len(tasks_db)}")

    # Also try to save to Supabase (optional, non-blocking)
    if supabase:
        try:
            supabase.table("tasks").insert({
                "id": task_id,
                "status": "queued"
            }).execute()
            print(f"[TASK {task_id}] Also saved to Supabase.")
        except Exception as e:
            print(f"[TASK {task_id}] Supabase insert failed (non-fatal): {e}")

    background_tasks.add_task(run_pipeline, task_id, file_path, tasks_db)
    
    return {"taskId": task_id}

@router.get("/api/task/{task_id}/status")
async def get_task_status(task_id: str):
    # Always check in-memory first (primary)
    task = tasks_db.get(task_id)
    if task:
        return task

    # Fallback: try Supabase
    if supabase:
        try:
            response = supabase.table("tasks").select("*").eq("id", task_id).execute()
            if response.data:
                t = response.data[0]
                return {
                    "status": t.get("status"),
                    "progress": 0,
                    "result": t.get("result"),
                    "error": t.get("error")
                }
        except Exception as e:
            print(f"Supabase status error: {e}")

    raise HTTPException(status_code=404, detail="Task not found")

@router.get("/api/result/{task_id}")
async def get_task_result(task_id: str):
    # Always check in-memory first (primary)
    task = tasks_db.get(task_id)

    # Fallback: try Supabase
    if not task and supabase:
        try:
            response = supabase.table("tasks").select("*").eq("id", task_id).execute()
            if response.data:
                task = response.data[0]
        except Exception as e:
            print(f"Supabase result error: {e}")

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
            
    if task.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Task not completed yet")
    return task.get("result")
