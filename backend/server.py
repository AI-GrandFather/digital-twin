from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json
import uuid
from datetime import datetime
import boto3
from botocore.exceptions import ClientError
from context import prompt

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"],
)


# Initialize AI Client (OpenAI-compatible client or Bedrock fallback)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

if OPENAI_API_KEY:
    import openai
    api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    ai_client = openai.OpenAI(
        api_key=OPENAI_API_KEY,
        base_url=api_base
    )
    MODEL_ID = os.getenv("OPENAI_MODEL_ID", "gpt-4o-mini")
else:
    bedrock_client = boto3.client(
        service_name="bedrock-runtime", 
        region_name=os.getenv("DEFAULT_AWS_REGION", "us-east-1")
    )
    MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0")




# Memory storage configuration
USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET", "")
MEMORY_DIR = os.getenv("MEMORY_DIR", "../memory")

# Initialize S3 client if needed
if USE_S3:
    s3_client = boto3.client("s3")


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


class Message(BaseModel):
    role: str
    content: str
    timestamp: str


# Memory management functions
def get_memory_path(session_id: str) -> str:
    return f"{session_id}.json"


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history from storage"""
    if USE_S3:
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=get_memory_path(session_id))
            return json.loads(response["Body"].read().decode("utf-8"))
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return []
            raise
    else:
        # Local file storage
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
        return []


def save_conversation(session_id: str, messages: List[Dict]):
    """Save conversation history to storage"""
    if USE_S3:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=get_memory_path(session_id),
            Body=json.dumps(messages, indent=2),
            ContentType="application/json",
        )
    else:
        # Local file storage
        os.makedirs(MEMORY_DIR, exist_ok=True)
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        with open(file_path, "w") as f:
            json.dump(messages, f, indent=2)


def call_llm_stream(conversation: List[Dict], user_message: str):
    """Call OpenAI-compatible model or Bedrock depending on configuration and stream the response chunks"""
    if OPENAI_API_KEY:
        # Build messages in standard ChatCompletion format
        messages = [
            {"role": "system", "content": prompt()}
        ]
        # Add conversation history
        for msg in conversation[-50:]:
            role = "assistant" if msg["role"] == "assistant" else "user"
            messages.append({
                "role": role,
                "content": msg["content"]
            })
        # Add current user message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        try:
            response = ai_client.chat.completions.create(
                model=MODEL_ID,
                messages=messages,
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )
            for chunk in response:
                if chunk.choices and len(chunk.choices) > 0:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
        except Exception as e:
            print(f"LLM API error in stream: {e}")
            yield f"Error: {str(e)}"
    else:
        # Call AWS Bedrock converse_stream
        messages = []
        messages.append({
            "role": "user", 
            "content": [{"text": f"System: {prompt()}"}]
        })
        for msg in conversation[-50:]:
            messages.append({
                "role": msg["role"],
                "content": [{"text": msg["content"]}]
            })
        messages.append({
            "role": "user",
            "content": [{"text": user_message}]
        })
        try:
            response = bedrock_client.converse_stream(
                modelId=MODEL_ID,
                messages=messages,
                inferenceConfig={
                    "maxTokens": 2000,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            )
            for event in response.get("stream"):
                if "contentBlockDelta" in event:
                    text = event["contentBlockDelta"]["delta"]["text"]
                    yield text
        except ClientError as e:
            print(f"Bedrock error in stream: {e}")
            yield f"Bedrock error: {str(e)}"


@app.get("/")
async def root():
    return {
        "message": "AI Digital Twin API (Powered by OpenAI/Compatible)" if OPENAI_API_KEY else "AI Digital Twin API (Powered by AWS Bedrock)",
        "memory_enabled": True,
        "storage": "S3" if USE_S3 else "local",
        "ai_model": MODEL_ID
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "use_s3": USE_S3,
        "ai_model": MODEL_ID,
        "provider": "OpenAI/Compatible" if OPENAI_API_KEY else "Bedrock"
    }



@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Load conversation history
        conversation = load_conversation(session_id)

        def stream_generator():
            full_response = []
            for chunk in call_llm_stream(conversation, request.message):
                yield chunk
                full_response.append(chunk)
            
            # Save history once stream is completed
            assistant_response = "".join(full_response)
            conversation.append(
                {"role": "user", "content": request.message, "timestamp": datetime.now().isoformat()}
            )
            conversation.append(
                {
                    "role": "assistant",
                    "content": assistant_response,
                    "timestamp": datetime.now().isoformat(),
                }
            )
            save_conversation(session_id, conversation)

        headers = {
            "X-Session-ID": session_id,
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream"
        }
        return StreamingResponse(stream_generator(), headers=headers)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Retrieve conversation history"""
    try:
        conversation = load_conversation(session_id)
        return {"session_id": session_id, "messages": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)