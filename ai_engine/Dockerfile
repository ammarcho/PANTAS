# PANTAS Grading API — Hugging Face Spaces (Docker SDK) memakai port 7860.
# Build context = folder ai_engine/ (salin folder ini ke repo Space).
FROM python:3.11-slim

# libgl/libglib: dependensi runtime OpenCV
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860
# Cloud Run menyuntikkan $PORT; default 7860 (HF Spaces / lokal).
CMD uvicorn api:app --host 0.0.0.0 --port ${PORT:-7860}
