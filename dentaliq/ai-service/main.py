# ai-service/main.py
"""
DentalIQ AI Microservice
FastAPI wrapper around Anthropic Claude API.
Exposes POST /generate — accepts message + patient context, returns AI reply.
"""
import os
import logging
from typing import Optional
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL = os.getenv("AI_MODEL", "claude-sonnet-4-20250514")
MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "800"))
TIMEOUT = float(os.getenv("AI_TIMEOUT_SECONDS", "20"))

MOCK_MODE = not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.startswith("sk-demo")

MOCK_RESPONSES = [
    "For optimal dental health, I recommend brushing twice daily with a fluoride toothpaste, flossing once a day, and maintaining regular six-month check-up appointments. A diet low in sugary and acidic foods will also significantly benefit your oral health.",
    "Based on what you have shared, it would be best to schedule a follow-up appointment to properly assess this. In the meantime, avoid very hot or cold foods if you are experiencing sensitivity, and contact the clinic immediately if pain becomes severe.",
    "Great question! Sensitivity after a cleaning or whitening procedure is completely normal and typically resolves within 24-48 hours. Using a sensitivity toothpaste and avoiding extreme temperatures during this period will help manage any discomfort.",
    "Maintaining excellent home care is the most important thing you can do between visits. This means brushing for two full minutes twice a day, flossing daily, and using an antibacterial mouthwash if recommended by your dentist.",
]
_mock_idx = 0


class HistoryItem(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class GenerateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    patient_context: Optional[str] = Field(None, description="Patient context string from backend")
    history: list[HistoryItem] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    reply: str
    model: str
    mock: bool = False


def build_system_prompt(patient_context: Optional[str]) -> str:
    base = (
        "You are a helpful, professional dental assistant AI. "
        "You assist patients with questions about dental health, procedures, and aftercare. "
        "Always be empathetic, clear, and evidence-based. "
        "For any serious symptoms, always advise the patient to contact or visit the clinic. "
        "Never diagnose conditions — you are a helpful guide, not a substitute for professional care."
    )
    if patient_context:
        return f"{base}\n\nPatient context for this conversation:\n{patient_context}"
    return base


def build_messages(history: list[HistoryItem], user_message: str) -> list[dict]:
    msgs = [{"role": h.role, "content": h.content} for h in history[-10:]]  # last 10 turns
    msgs.append({"role": "user", "content": user_message})
    return msgs


@asynccontextmanager
async def lifespan(app: FastAPI):
    mode = "MOCK" if MOCK_MODE else f"LIVE ({MODEL})"
    logger.info(f"DentalIQ AI Service starting — mode: {mode}")
    yield
    logger.info("DentalIQ AI Service shutting down")


app = FastAPI(
    title="DentalIQ AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to API gateway origin in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": MOCK_MODE, "model": MODEL}


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    global _mock_idx

    if MOCK_MODE:
        reply = MOCK_RESPONSES[_mock_idx % len(MOCK_RESPONSES)]
        _mock_idx += 1
        logger.info(f"[MOCK] Responding to: {req.message[:60]}...")
        return GenerateResponse(reply=reply, model="mock", mock=True)

    system_prompt = build_system_prompt(req.patient_context)
    messages = build_messages(req.history, req.message)

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": MODEL,
                    "max_tokens": MAX_TOKENS,
                    "system": system_prompt,
                    "messages": messages,
                },
            )

        if response.status_code != 200:
            logger.error(f"Anthropic API error {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=502,
                detail=f"AI provider returned {response.status_code}",
            )

        data = response.json()
        reply = data["content"][0]["text"]
        logger.info(f"Generated reply ({len(reply)} chars) for: {req.message[:60]}...")
        return GenerateResponse(reply=reply, model=MODEL)

    except httpx.TimeoutException:
        logger.error("Anthropic API request timed out")
        raise HTTPException(status_code=504, detail="AI service timed out")
    except httpx.RequestError as e:
        logger.error(f"Network error calling Anthropic: {e}")
        raise HTTPException(status_code=502, detail="Failed to reach AI provider")
