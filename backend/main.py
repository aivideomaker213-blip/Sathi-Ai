import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"status": "ok", "assistant": "SATHI AI (साथी एआई)"}


@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="सन्देश खाली हुनुहुँदैन।")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY सेट गरिएको छैन। कृपया Environment Variable मा राख्नुहोस्।",
        )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_msg,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "तिमी SATHI AI (साथी एआई) हौ, एक सहयोगी, स्पष्ट र मित्रवत् नेपाली एआई असिस्टेन्ट। "
                    "सधैँ प्राकृतिक र बुझिने नेपाली भाषामा जवाफ देऊ।"
                )
            ),
        )
        reply_text = response.text or "माफ गर्नुहोस्, अहिले जवाफ तयार पार्न सकिएन।"
        return {"reply": reply_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI जवाफ ल्याउँदा समस्या आयो: {str(e)}")

