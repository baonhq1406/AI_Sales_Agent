import os
import io
import json
import time
import base64
import hashlib
import tempfile
import asyncio
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import soundfile as sf
import torch
import edge_tts
from rvc_python.infer import RVCInference

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("CelebrityRvcTTS")

app = FastAPI(title="EdgeTTS + RVC v2 GPU Celebrity & Enterprise TTS Service", version="3.0.0")

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS_DIR = os.path.join(BASE_DIR, "voices", "models")
DISK_CACHE_DIR = os.path.join(BASE_DIR, "voices", "rvc_cache")
os.makedirs(DISK_CACHE_DIR, exist_ok=True)

device = "cuda:0" if torch.cuda.is_available() else "cpu"
logger.info(f"RVC Compute Device: {device} (CUDA Available: {torch.cuda.is_available()})")
if torch.cuda.is_available():
    logger.info(f"GPU: {torch.cuda.get_device_name(0)}")

# Initialize RVC Inference Engine on GPU
rvc = RVCInference(device=device)
RVC_LOCK = asyncio.Lock()

# Celebrity Profiles using RVC v2 (.pth + .index)
CELEB_MODELS = {
    "vn-sontung-mtp": {
        "name": "Sơn Tùng M-TP",
        "pth": os.path.join(MODELS_DIR, "sontung", "sontung.pth"),
        "index": os.path.join(MODELS_DIR, "sontung", "sontung.index"),
        "f0_up_key": 0,
        "base_edge_voice": "vi-VN-NamMinhNeural",
        "description": "Sơn Tùng M-TP (Sky Edition — RVC v2 Real AI Voice Clone)",
    },
    "vn-jack-j97": {
        "name": "Jack — J97",
        "pth": os.path.join(MODELS_DIR, "jack", "jack97.pth"),
        "index": os.path.join(MODELS_DIR, "jack", "jack97.index"),
        "f0_up_key": 0,
        "base_edge_voice": "vi-VN-NamMinhNeural",
        "description": "Jack — J97 (Đom Đóm Edition — RVC v2 Real AI Voice Clone)",
    },
    "vn-domixi": {
        "name": "Độ Mixi",
        "pth": os.path.join(MODELS_DIR, "domixi", "domixi.pth"),
        "index": os.path.join(MODELS_DIR, "domixi", "added_IVF344_Flat_nprobe_1_domixi_v2.index"),
        "f0_up_key": 0,
        "base_edge_voice": "vi-VN-NamMinhNeural",
        "description": "Độ Mixi (Bộ Tộc MixiGaming — RVC v2 Real AI Voice Clone)",
    },
}

# Verify available models and pre-load each celebrity into GPU VRAM for 0s switching
AVAILABLE_CELEBS = set()
RVC_ENGINES: dict[str, RVCInference] = {}

for vid, conf in CELEB_MODELS.items():
    if os.path.exists(conf["pth"]):
        try:
            logger.info(f"Pre-loading RVC celebrity model '{conf['name']}' into GPU VRAM...")
            eng = RVCInference(device=device)
            eng.load_model(conf["pth"], version="v2", index_path=conf["index"])
            eng.set_params(
                f0method="rmvpe",
                f0up_key=conf["f0_up_key"],
                index_rate=0.25,
                filter_radius=3,
                rms_mix_rate=0.25,
                protect=0.33,
            )
            RVC_ENGINES[vid] = eng
            AVAILABLE_CELEBS.add(vid)
            logger.info(f"Verified & pre-loaded '{conf['name']}' on {device}!")
        except Exception as e:
            logger.warning(f"Failed to pre-load '{conf['name']}': {e}")
    else:
        logger.warning(f"RVC model not found for '{conf['name']}': {conf['pth']}")


# Enterprise Voices (Direct Studio-grade Edge-TTS)
ENTERPRISE_VOICES = {
    "vn-trucly-female": {
        "name": "Trúc Ly",
        "edge_voice": "vi-VN-HoaiMyNeural",
        "gender": "female",
        "rate": "+0%",
        "pitch": "+0Hz",
        "description": "Trúc Ly (Nữ Tiếp Tân Doanh Nghiệp B2B)",
    },
    "vn-minhquan-male": {
        "name": "Minh Quân",
        "edge_voice": "vi-VN-NamMinhNeural",
        "gender": "male",
        "rate": "+0%",
        "pitch": "+0Hz",
        "description": "Minh Quân (Nam Chuyên Viên B2B)",
    },
    "vn-adam-male": {
        "name": "Adam",
        "edge_voice": "vi-VN-NamMinhNeural",
        "gender": "male",
        "rate": "+5%",
        "pitch": "-2Hz",
        "description": "Adam (Nam Miền Nam Ấm Áp)",
    },
    "vn-myduyen-female": {
        "name": "Mỹ Duyên",
        "edge_voice": "vi-VN-HoaiMyNeural",
        "gender": "female",
        "rate": "+0%",
        "pitch": "+2Hz",
        "description": "Mỹ Duyên (Nữ Diễn Cảm)",
    },
    "vn-aihan-female": {
        "name": "Ái Hân",
        "edge_voice": "vi-VN-HoaiMyNeural",
        "gender": "female",
        "rate": "+0%",
        "pitch": "+0Hz",
        "description": "Ái Hân (Nữ Lễ Tân Chuẩn Mực)",
    },
    "vn-namminh-male": {
        "name": "Nam Minh",
        "edge_voice": "vi-VN-NamMinhNeural",
        "gender": "male",
        "rate": "-4%",
        "pitch": "-1Hz",
        "description": "Nam Minh (Nam Chuyên Viên Miền Bắc)",
    },
    "vn-hoaimy-female": {
        "name": "Hoài My",
        "edge_voice": "vi-VN-HoaiMyNeural",
        "gender": "female",
        "rate": "+2%",
        "pitch": "+0Hz",
        "description": "Hoài My (Nữ Tư Vấn Miền Nam)",
    },
}

AUDIO_CACHE: dict = {}

class SynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "vn-sontung-mtp"
    steps: Optional[int] = None
    speed: Optional[float] = 1.0

@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "edge-tts+rvc-v2-cuda",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
        "available_celebrities": list(AVAILABLE_CELEBS),
    }

@app.get("/voices")
def list_voices():
    result = []
    # Celebrity voices
    for vid, conf in CELEB_MODELS.items():
        result.append({
            "id": vid,
            "name": conf["name"],
            "gender": "male",
            "is_celebrity": True,
            "available": vid in AVAILABLE_CELEBS,
            "description": conf["description"],
        })
    # Enterprise voices
    for vid, conf in ENTERPRISE_VOICES.items():
        result.append({
            "id": vid,
            "name": conf["name"],
            "gender": conf["gender"],
            "is_celebrity": False,
            "available": True,
            "description": conf["description"],
        })
    return result

async def generate_edge_wav(text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz", speed: float = 1.0) -> bytes:
    if speed != 1.0 and rate == "+0%":
        pct = int(round((speed - 1.0) * 100))
        rate = f"{pct:+d}%"

    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])
            val = buffer.getvalue()
            if val and len(val) > 0:
                return val
        except Exception as e:
            logger.warning(f"edge_tts attempt {attempt + 1} for '{voice}' failed: {e}")
            await asyncio.sleep(0.2)

    # Fallback to plain voice without pitch/rate
    try:
        communicate = edge_tts.Communicate(text, voice)
        buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buffer.write(chunk["data"])
        return buffer.getvalue()
    except Exception as e:
        logger.error(f"edge_tts fallback failed for '{voice}': {e}")
        raise

@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    raw_voice_id = (req.voice_id or "vn-sontung-mtp").lower()
    if "sontung" in raw_voice_id or "mtp" in raw_voice_id:
        voice_id = "vn-sontung-mtp"
    elif "jack" in raw_voice_id or "j97" in raw_voice_id:
        voice_id = "vn-jack-j97"
    elif "domixi" in raw_voice_id or "mixi" in raw_voice_id:
        voice_id = "vn-domixi"
    elif "trucly" in raw_voice_id:
        voice_id = "vn-trucly-female"
    else:
        voice_id = raw_voice_id
    speed = req.speed or 1.0

    cache_key = f"{voice_id}:{speed}:{text}"
    if cache_key in AUDIO_CACHE:
        logger.info(f"Serving cached audio for '{voice_id}' (0.00s)")
        return AUDIO_CACHE[cache_key]

    disk_hash = hashlib.md5(f"{voice_id}:{text}".encode("utf-8")).hexdigest()
    disk_path = os.path.join(DISK_CACHE_DIR, f"{disk_hash}.json")
    if os.path.exists(disk_path):
        try:
            with open(disk_path, "r", encoding="utf-8") as f:
                cached_disk = json.load(f)
            if cached_disk.get("audio_base64"):
                AUDIO_CACHE[cache_key] = cached_disk
                logger.info(f"Serving disk-cached RVC audio for '{voice_id}' (0.00s)")
                return cached_disk
        except Exception:
            pass

    # 1. CELEBRITY VOICE CONVERSION VIA RVC V2
    if voice_id in CELEB_MODELS and voice_id in AVAILABLE_CELEBS:
        celeb = CELEB_MODELS[voice_id]
        t0 = time.time()
        
        # Step A: Synthesize crystal-clear Vietnamese base speech via Edge-TTS
        edge_raw = await generate_edge_wav(
            text=text,
            voice=celeb["base_edge_voice"],
            rate="+0%",
            pitch="+0Hz",
            speed=speed,
        )
        
        # Step B: Convert voice using RVC v2 Model on GPU (serialized with RVC_LOCK)
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f_in, \
             tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_out:
            in_path = f_in.name
            out_path = f_out.name
            f_in.write(edge_raw)
            f_in.flush()

        try:
            async with RVC_LOCK:
                eng = RVC_ENGINES.get(voice_id)
                if eng is None:
                    eng = rvc
                    if eng.current_model != os.path.basename(celeb["pth"]):
                        eng.load_model(celeb["pth"], version="v2", index_path=celeb["index"])
                    eng.set_params(
                        f0method="rmvpe",
                        f0up_key=celeb["f0_up_key"],
                        index_rate=0.25,
                        filter_radius=3,
                        rms_mix_rate=0.25,
                        protect=0.33,
                    )
                else:
                    # Share HuBERT model across engines once loaded to save VRAM and init time
                    for other_eng in RVC_ENGINES.values():
                        if other_eng.vc.hubert_model is not None and eng.vc.hubert_model is None:
                            eng.vc.hubert_model = other_eng.vc.hubert_model
                            break
                
                # Execute conversion synchronously in threadpool to keep FastAPI async
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(None, eng.infer_file, in_path, out_path)
            
            data, sr = sf.read(out_path)
            duration = round(len(data) / sr, 2)
            with open(out_path, "rb") as f:
                wav_bytes = f.read()

            t_total = time.time() - t0
            logger.info(f"Synthesized celebrity voice '{celeb['name']}' in {t_total:.2f}s (duration: {duration}s)")

            resp_data = {
                "audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
                "mime_type": "audio/wav",
                "sample_rate": sr,
                "duration": duration,
                "voice": celeb["name"],
                "voice_id": voice_id,
                "provider": f"edge-tts + rvc-v2-gpu ({celeb['name']})",
            }
            if len(AUDIO_CACHE) < 500:
                AUDIO_CACHE[cache_key] = resp_data
            try:
                with open(disk_path, "w", encoding="utf-8") as f:
                    json.dump(resp_data, f)
            except Exception as e:
                logger.warning(f"Failed to write disk cache {disk_path}: {e}")
            return resp_data
        except Exception as e:
            logger.error(f"RVC synthesis failed for {voice_id}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"RVC conversion error: {str(e)}")
        finally:
            for p in [in_path, out_path]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass

    # 2. ENTERPRISE VOICES VIA DIRECT STUDIO-GRADE EDGE-TTS
    ent = ENTERPRISE_VOICES.get(voice_id, ENTERPRISE_VOICES["vn-minhquan-male"])
    t0 = time.time()
    try:
        mp3_bytes = await generate_edge_wav(
            text=text,
            voice=ent["edge_voice"],
            rate=ent["rate"],
            pitch=ent["pitch"],
            speed=speed,
        )
        
        # Read duration from mp3 bytes using soundfile
        with io.BytesIO(mp3_bytes) as bio:
            data, sr = sf.read(bio)
            duration = round(len(data) / sr, 2)

        t_total = time.time() - t0
        logger.info(f"Synthesized enterprise voice '{ent['name']}' in {t_total:.2f}s (duration: {duration}s)")

        resp_data = {
            "audio_base64": base64.b64encode(mp3_bytes).decode("ascii"),
            "mime_type": "audio/mpeg",
            "sample_rate": sr,
            "duration": duration,
            "voice": ent["name"],
            "voice_id": voice_id,
            "provider": f"edge-tts-neural ({ent['name']})",
        }
        if len(AUDIO_CACHE) < 500:
            AUDIO_CACHE[cache_key] = resp_data
        return resp_data
    except Exception as e:
        logger.error(f"Enterprise synthesis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def warm_up_greetings():
    logger.info("Scheduling background pre-warm of greetings for 0s instant latency...")
    asyncio.create_task(_background_prewarm())

async def _background_prewarm():
    await asyncio.sleep(1.0)
    sample_texts = [
        # Previews
        ("vn-sontung-mtp", "Ú òa! Sơn Tùng M-TP xin chào cả nhà Sky và quý khách hàng nha! Rất vui được đồng hành cùng giải pháp AI Sales Agent siêu đỉnh này!"),
        ("vn-jack-j97", "Dạ em chào anh chị và đại gia đình Đom Đóm nha! Em là Jack đây, chúc anh chị một ngày làm việc thật nhiều niềm vui và may mắn!"),
        ("vn-domixi", "Hế lô anh em, lại là tôi Tộc Trưởng Độ Phùng đây! Giải pháp AI Sales Agent này nó phải gọi là đỉnh nóc kịch trần luôn anh em ơi!"),
        ("vn-trucly-female", "Dạ xin kính chào quý khách đã gọi đến tổng đài AI Sales Agent! Em là Trúc Ly, rất vui được giải đáp mọi thắc mắc của anh chị về giải pháp Voice AI và bảng giá bên em ạ!"),
        # WF-01 Default Outbound (Trần Văn An - DB Lead #1)
        ("vn-sontung-mtp", "Ú òa, chào anh Trần Văn An nha! Mình là Sơn Tùng M-TP đây! Thấy công ty mình đang tìm hiểu giải pháp AI Sales Agent siêu đỉnh này, Tùng có thể hỗ trợ tư vấn chi tiết cho anh nhé!"),
        ("vn-jack-j97", "Dạ em chào anh Trần Văn An nha! Em là Jack đây ạ, thấy công ty mình đang quan tâm giải pháp Voice AI và tự động hóa bán hàng bên em, em có thể hỗ trợ anh thông tin gì hôm nay ạ?"),
        ("vn-domixi", "Hế lô anh Trần Văn An, lại là tôi Tộc Trưởng Độ Phùng đây! Thấy anh đang quan tâm nền tảng AI Sales Agent thông minh, để tôi tư vấn cho anh giải pháp phù hợp nhất luôn nhé!"),
        ("vn-trucly-female", "Dạ em chào anh Trần Văn An! Em là Trúc Ly từ đội ngũ giải pháp AI Sales Agent. Em thấy bên mình đang quan tâm giải pháp Voice AI và tự động hóa CRM, em có thể hỗ trợ tư vấn thông tin gì cho bên anh ạ?"),
        # WF-01 Default Outbound (Quý khách fallback)
        ("vn-sontung-mtp", "Ú òa, chào anh Quý khách nha! Mình là Sơn Tùng M-TP đây! Thấy công ty mình đang tìm hiểu giải pháp AI Sales Agent siêu đỉnh này, Tùng có thể hỗ trợ tư vấn chi tiết cho anh nhé!"),
        ("vn-jack-j97", "Dạ em chào anh Quý khách nha! Em là Jack đây ạ, thấy công ty mình đang quan tâm giải pháp Voice AI và tự động hóa bán hàng bên em, em có thể hỗ trợ anh thông tin gì hôm nay ạ?"),
        ("vn-domixi", "Hế lô anh Quý khách, lại là tôi Tộc Trưởng Độ Phùng đây! Thấy anh đang quan tâm nền tảng AI Sales Agent thông minh, để tôi tư vấn cho anh giải pháp phù hợp nhất luôn nhé!"),
        ("vn-trucly-female", "Dạ em chào anh Quý khách! Em là Trúc Ly từ đội ngũ giải pháp AI Sales Agent. Em thấy bên mình đang quan tâm giải pháp Voice AI và tự động hóa CRM, em có thể hỗ trợ tư vấn thông tin gì cho bên anh ạ?"),
        # WF-02 Hotline
        ("vn-sontung-mtp", "Tổng đài AI Sales Agent xin chào! Mình là Sơn Tùng M-TP đây, rất vui được trực tiếp hỗ trợ giải đáp mọi thắc mắc về bảng giá và tính năng cho bạn nha!"),
        ("vn-jack-j97", "Dạ, Tổng đài AI xin nghe ạ! Em là Jack đây, chúc anh chị một ngày làm việc thật nhiều năng lượng. Em có thể hỗ trợ tư vấn thông tin gì cho mình ạ?"),
        ("vn-domixi", "Alo alo, Tổng đài AI Sales Agent xin nghe! Tộc Trưởng Độ Phùng đây anh em ơi, anh em đang muốn tìm hiểu về bảng giá hay tính năng nào của hệ thống thế?"),
        ("vn-trucly-female", "Dạ, Tổng đài AI Sales Agent xin kính chào quý khách! Em là Trúc Ly - Lễ tân AI tiếp nhận cuộc gọi, rất vui được hỗ trợ giải đáp thông tin về bảng giá và tính năng cho anh chị ạ!"),
        # WF-01 TechZone Retail Outbound (Trần Văn An)
        ("vn-sontung-mtp", "Ú òa, chào Trần Văn An nha! Mình là Sơn Tùng M-TP đại sứ TechZone đây! Thấy bạn vừa quan tâm iPhone 16 Series và MacBook chính hãng, Tùng hỗ trợ báo giá và quà tặng ngay nhé!"),
        ("vn-jack-j97", "Dạ em chào anh Trần Văn An nha! Em là Jack đại sứ Cửa hàng Công nghệ TechZone đây ạ. Hôm nay em hỗ trợ tư vấn phiên bản và kiểm tra tồn kho máy cho mình nghen!"),
        ("vn-domixi", "Hế lô anh Trần Văn An, Độ Phùng đại sứ TechZone đây anh em ơi! Nghe nói anh đang tăm tia con iPhone 16 Pro Max hay MacBook M4, để tôi check giá ưu đãi và quà tặng cho anh em luôn nhé!"),
        ("vn-trucly-female", "Dạ em chào anh Trần Văn An! Em là Trúc Ly từ Cửa Hàng Công Nghệ TechZone. Em thấy mình vừa quan tâm iPhone 16 Series và MacBook chính hãng, em có thể hỗ trợ tư vấn phiên bản nào cho mình ạ?"),
        # WF-01 TechZone Retail Outbound (Quý khách)
        ("vn-sontung-mtp", "Ú òa, chào Quý khách nha! Mình là Sơn Tùng M-TP đại sứ TechZone đây! Thấy bạn vừa quan tâm iPhone 16 Series và MacBook chính hãng, Tùng hỗ trợ báo giá và quà tặng ngay nhé!"),
        ("vn-jack-j97", "Dạ em chào anh Quý khách nha! Em là Jack đại sứ Cửa hàng Công nghệ TechZone đây ạ. Hôm nay em hỗ trợ tư vấn phiên bản và kiểm tra tồn kho máy cho mình nghen!"),
        ("vn-domixi", "Hế lô anh Quý khách, Độ Phùng đại sứ TechZone đây anh em ơi! Nghe nói anh đang tăm tia con iPhone 16 Pro Max hay MacBook M4, để tôi check giá ưu đãi và quà tặng cho anh em luôn nhé!"),
        ("vn-trucly-female", "Dạ em chào anh Quý khách! Em là Trúc Ly từ Cửa Hàng Công Nghệ TechZone. Em thấy mình vừa quan tâm iPhone 16 Series và MacBook chính hãng, em có thể hỗ trợ tư vấn phiên bản nào cho mình ạ?"),
        # WF-02 TechZone Hotline Inbound
        ("vn-sontung-mtp", "Cửa hàng Công nghệ TechZone xin chào! Mình là Sơn Tùng M-TP đây, rất vui được hỗ trợ kiểm tra giá, tồn kho máy và ưu đãi hôm nay cho bạn nha!"),
        ("vn-jack-j97", "Dạ, Hotline Cửa Hàng TechZone xin nghe ạ! Em là Jack đây, chúc anh chị một ngày vui vẻ. Mình đang quan tâm dòng máy hay cần kiểm tra tồn kho ở chi nhánh nào ạ?"),
        ("vn-domixi", "Alo alo, Hotline Cửa Hàng TechZone xin nghe! Độ Phùng đây anh em ơi, đang muốn check giá iPhone 16, MacBook hay hỏi địa chỉ chi nhánh gần nhất thế?"),
        ("vn-trucly-female", "Dạ, Cửa hàng Công nghệ TechZone xin kính chào quý khách! Em là Trúc Ly, rất vui được hỗ trợ anh chị tra cứu giá bán, quà tặng và kiểm tra tồn kho sản phẩm ạ!"),
        # Common Retail & B2B Q&A Answers for all 3 celebrities
        *[
            (vid, txt)
            for vid in ["vn-sontung-mtp", "vn-jack-j97", "vn-domixi"]
            for txt in [
                "Dạ iPhone 16 Pro Max 256GB hôm nay ưu đãi chỉ 31 triệu 490 nghìn, tặng kèm củ sạc Apple 30W chính hãng ạ!",
                "Dạ máy đang sẵn hàng tại cả 3 chi nhánh Hà Nội, Đà Nẵng và TP.HCM, anh/chị có thể ghé xem máy bất cứ lúc nào ạ!",
                "Dạ bên em miễn phí ship toàn quốc, nội thành giao hỏa tốc 2 giờ và anh/chị được kiểm tra máy trước khi thanh toán ạ!",
                "Dạ bên em cam kết lỗi 1 đổi 1 trong 30 ngày đầu tiên và bảo hành chính hãng Apple 12 tháng toàn quốc ạ!",
                "Dạ bên em hỗ trợ trả góp 0% qua thẻ tín dụng hoặc CCCD duyệt hồ sơ online chỉ trong 5 phút ạ!",
                "Dạ gói Pro bên em là 5 triệu đồng một tháng, có đầy đủ Voice AI và hỗ trợ dùng thử miễn phí 14 ngày ạ!",
            ]
        ],
    ]
    for vid, txt in sample_texts:
        try:
            req = SynthesizeRequest(text=txt, voice_id=vid)
            await synthesize(req)
            logger.info(f"Pre-warmed greeting for '{vid}' ready in cache!")
        except Exception as e:
            logger.warning(f"Pre-warm failed for '{vid}': {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("TTS_PORT", "8008"))
    uvicorn.run(app, host="0.0.0.0", port=port)
