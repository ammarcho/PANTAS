"""
FastAPI pembungkus PantasModel (docs/BACKEND.md Fase 2).

Satu endpoint inti: POST /predict — menerima foto batch + komoditas, dan
mengembalikan persis `dict_results` dari model.py, plus `annotated_img`
(JPEG data URL) untuk ditampilkan di layar hasil.

Jalankan lokal:
    uvicorn api:app --host 0.0.0.0 --port 7860

Deploy: Hugging Face Spaces (Docker) — lihat Dockerfile di folder ini.
"""

import base64
import json

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from model import PantasModel

app = FastAPI(title="PANTAS Grading API", version="1.0.0")

# Frontend Vercel + dev lokal. Kredensial tidak dipakai, jadi wildcard aman.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Muat sekali saat startup; PantasModel meng-cache model YOLO per komoditas.
model = PantasModel()

VALID_COMMODITY_BASES = {"chili", "tomato", "carrot", "cucumber"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    commodity: str = Form(...),
    roi: str | None = Form(None),  # opsional: "[x, y, w, h]" (JSON)
):
    base = commodity.split("_")[0]
    if base not in VALID_COMMODITY_BASES:
        return {
            "status": "error",
            "message": (
                f"Komoditas '{commodity}' belum didukung. "
                f"Pilihan: {sorted(VALID_COMMODITY_BASES)}."
            ),
        }

    raw = await image.read()
    img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {"status": "error", "message": "File yang diunggah bukan gambar valid."}

    roi_tuple = None
    if roi:
        try:
            parsed = json.loads(roi)
            roi_tuple = tuple(int(v) for v in parsed)
            if len(roi_tuple) != 4:
                raise ValueError
        except (ValueError, TypeError):
            return {"status": "error", "message": "roi harus JSON [x, y, w, h]."}

    try:
        results, annotated = model.predict(img, commodity, roi=roi_tuple)
    except FileNotFoundError as e:
        return {"status": "error", "message": str(e)}

    # Engine menolak foto blur dengan status:"error" — teruskan apa adanya.
    if results.get("status") == "success":
        ok, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok:
            results["annotated_img"] = (
                "data:image/jpeg;base64," + base64.b64encode(buf).decode()
            )
    return results
