from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
import uuid
import os
import shutil
from services.pipeline import run_pipeline
from services.supabase_client import supabase

router = APIRouter()

# In-memory mock database for tasks
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

    # Register task
    task_record = {
        "id": task_id,
        "status": "queued",
        "progress": 0,
        "result": None,
        "error": None
    }
    
    if supabase:
        try:
            # We don't insert 'error' or 'progress' as columns initially unless they exist in schema.
            # Assuming 'tasks' table has: id, status, result (jsonb), error (text)
            supabase.table("tasks").insert({
                "id": task_id,
                "status": "queued"
            }).execute()
        except Exception as e:
            print(f"Failed to create task in Supabase: {e}")
            tasks_db[task_id] = task_record
    else:
        tasks_db[task_id] = task_record

    background_tasks.add_task(run_pipeline, task_id, file_path, tasks_db)
    
    return {"taskId": task_id}

@router.get("/api/task/{task_id}/status")
async def get_task_status(task_id: str):
    if supabase:
        try:
            response = supabase.table("tasks").select("*").eq("id", task_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Task not found in Supabase")
            task = response.data[0]
            # Map Supabase row back to frontend expected format
            return {
                "status": task.get("status"),
                "progress": 0,
                "result": task.get("result"),
                "error": task.get("error")
            }
        except Exception as e:
            print(f"Supabase error: {e}")
            task = tasks_db.get(task_id)
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            return task
    else:
        task = tasks_db.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

@router.get("/api/result/{task_id}")
async def get_task_result(task_id: str):
    if supabase:
        response = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Task not found in Supabase")
        task = response.data[0]
    else:
        task = tasks_db.get(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
    if task.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Task not completed yet")
    return task.get("result")
