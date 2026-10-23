import os
import io
import base64
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import soundfile as sf
from vieneu import Vieneu

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("VieNeuTTS")

app = FastAPI(title="VieNeu Expressive TTS Service", version="1.0.0")

logger.info("Initializing Vieneu v3nano engine (CPU-optimized Flow-Matching)...")
tts = Vieneu(mode="v3nano")
logger.info("VieNeu v3nano engine initialized successfully.")

VOICES_DIR = os.getenv("VOICES_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "voices")))
CLEAN_VOICE_PATH = os.path.join(VOICES_DIR, "raw", "bao_voice_clean.wav")
RAW_VOICE_PATH = os.path.join(VOICES_DIR, "raw", "bao_voice.wav")
REF_PATH = CLEAN_VOICE_PATH if os.path.exists(CLEAN_VOICE_PATH) else RAW_VOICE_PATH

BAO_CLONE_AVAILABLE = False
if os.path.exists(REF_PATH):
    try:
        logger.info(f"Enrolling Bao voice clone from {REF_PATH}...")
        tts.add_voice("Bảo-Clone", ref_audio=REF_PATH)
        BAO_CLONE_AVAILABLE = True
        logger.info("Bao voice clone enrolled successfully!")
    except Exception as e:
        logger.warning(f"Could not enroll Bao voice clone: {e}")

VOICE_MAP = {
    "vn-minhquan-male": "Minh Quân",
    "vn-adam-male": "Adam",
    "vn-myduyen-female": "Mỹ Duyên",
    "vn-aihan-female": "Ái Hân",
    "clone-bao-owner": "Bảo-Clone" if BAO_CLONE_AVAILABLE else "Minh Quân",
    "vn-namminh-male": "Minh Quân",
    "vn-hoaimy-female": "Mỹ Duyên",
}

class SynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "vn-minhquan-male"
    steps: Optional[int] = None
    speed: Optional[float] = 1.0

@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "vieneu-v3-nano",
        "bao_clone_available": BAO_CLONE_AVAILABLE,
        "sample_rate": tts.sample_rate,
    }

@app.get("/voices")
def list_voices():
    return [
        {
            "id": "vn-minhquan-male",
            "name": "Minh Quân (Nam Bắc - Tự nhiên, truyền cảm)",
            "gender": "male",
            "is_default": True,
        },
        {
            "id": "vn-adam-male",
            "name": "Adam (Nam Nam - Ấm áp, tự nhiên)",
            "gender": "male",
            "is_default": False,
        },
        {
            "id": "vn-myduyen-female",
            "name": "Mỹ Duyên (Nữ Bắc - Diễn cảm, đọc truyện)",
            "gender": "female",
            "is_default": False,
        },
        {
            "id": "vn-aihan-female",
            "name": "Ái Hân (Nữ Nam - Phong cách tin tức)",
            "gender": "female",
            "is_default": False,
        },
        {
            "id": "clone-bao-owner",
            "name": "Bảo (AI Neural Clone từ mẫu thu âm)",
            "gender": "male",
            "is_default": False,
        },
    ]

@app.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    voice_id = req.voice_id or "vn-minhquan-male"
    target_voice = VOICE_MAP.get(voice_id, "Minh Quân")

    is_bao = target_voice == "Bảo-Clone"
    steps = req.steps if req.steps is not None else (14 if is_bao else 8)
    cfg = 3.0 if is_bao else 2.6
    sway = -0.2 if is_bao else -0.8

    try:
        audio = tts.infer(text, voice=target_voice, steps=steps, cfg=cfg, sway=sway, speed=req.speed or 1.0)
        buffer = io.BytesIO()
        sf.write(buffer, audio, tts.sample_rate, format="WAV", subtype="PCM_16")
        wav_bytes = buffer.getvalue()

        return {
            "audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
            "mime_type": "audio/wav",
            "sample_rate": tts.sample_rate,
            "duration": round(len(audio) / tts.sample_rate, 2),
            "voice": target_voice,
            "voice_id": voice_id,
            "provider": "vieneu-tts-v3-nano-expressive",
        }
    except Exception as e:
        logger.error(f"Synthesis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("TTS_PORT", "8008"))
    uvicorn.run(app, host="0.0.0.0", port=port)
