import os
import time
from typing import List, Literal, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

app = FastAPI(title="SATHI AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "gemini-3.8-flash"

SYSTEM_INSTRUCTION = (
    "तिमी SATHI AI (साथी एआई) हौ—एक छिटो, बुद्धिमान, सटीक र मित्रवत् नेपाली एआई असिस्टेन्ट। "
    "सधैँ प्राकृतिक, स्पष्ट र बुझिने नेपाली भाषामा जवाफ देऊ। "
    "यदि प्रयोगकर्ताले कोडिङ, प्रोग्रामिङ, डिबगिङ, वेबसाइट/एप बनाउने, अल्गोरिदम, गणित, वा कुनै प्राविधिक कुरा सोधेमा "
    "सफा, सही, अद्यावधिक र पूरा चल्ने कोड देऊ, आवश्यक ठाउँमा कोड ब्लक (```भाषा ... ```) प्रयोग गर, र नेपालीमा छोटो तथा स्पष्ट व्याख्या देऊ। "
    "सामान्य कुराकानी, लेखन, वा अन्य प्रश्नमा पनि छिटो, सटिक र सहयोगी जवाफ देऊ।"
)


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    text: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[HistoryItem]] = None


def build_contents(message: str, history: Optional[List[HistoryItem]]):
    contents = []
    if history:
        for item in history[-12:]:
            clean_text = (item.text or "").strip()
            if not clean_text:
                continue
            gemini_role = "model" if item.role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=clean_text)],
                )
            )
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=message.strip())],
        )
    )
    return contents


def get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY सेट गरिएको छैन। कृपया Environment Variable मा राख्नुहोस्।",
        )
    return genai.Client(api_key=api_key)


def get_config() -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        temperature=0.65,
        system_instruction=SYSTEM_INSTRUCTION,
    )


@app.get("/")
def root():
    return {"status": "ok", "assistant": "SATHI AI (साथी एआई)", "model": MODEL_NAME}


@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    user_msg = (req.message or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="सन्देश खाली हुनुहुँदैन।")

    client = get_client()
    contents = build_contents(user_msg, req.history)
    config = get_config()

    last_error = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=contents,
                config=config,
            )
            reply_text = response.text or "माफ गर्नुहोस्, अहिले जवाफ तयार पार्न सकिएन।"
            return {"reply": reply_text}
        except Exception as e:
            last_error = e
            err_str = str(e)
            if (
                "503" in err_str
                or "UNAVAILABLE" in err_str
                or "overloaded" in err_str.lower()
            ) and attempt < 2:
                time.sleep(0.7 * (attempt + 1))
                continue
            break

    raise HTTPException(
        status_code=500,
        detail=f"AI जवाफ ल्याउँदा समस्या आयो: {str(last_error)}",
    )


@app.post("/api/chat/stream")
def chat_stream_endpoint(req: ChatRequest):
    user_msg = (req.message or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="सन्देश खाली हुनुहुँदैन।")

    client = get_client()
    contents = build_contents(user_msg, req.history)
    config = get_config()

    def event_generator():
        try:
            stream = client.models.generate_content_stream(
                model=MODEL_NAME,
                contents=contents,
                config=config,
            )
            for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"\n\n[त्रुटि: AI जवाफ ल्याउँदा समस्या आयो — {str(e)}]"

    return StreamingResponse(event_generator(), media_type="text/plain; charset=utf-8")
