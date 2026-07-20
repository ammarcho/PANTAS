# PANTAS - Sistem Penyortir Sayur Cerdas (Dual-Stage YOLOv11 & Rule Engine) 🌶️🍅🥕🥒

PANTAS adalah sistem cerdas berbasis *Computer Vision* yang dirancang khusus untuk kebutuhan industri penyortiran komoditas pertanian. Mampu mengklasifikasikan mutu (Grade A, B, C, REJECT) secara akurat berdasarkan bentuk, ukuran, dan tingkat kerusakan fisik secara *real-time*.

## 🚀 Arsitektur Baru: Pendekatan Dual-Stage YOLO + Rule Engine
Untuk mengatasi masalah bias latar belakang (seperti tekstur meja atau warna tangan) dan mencapai akurasi tingkat industri, arsitektur sistem ini menggunakan pendekatan **Dua Tahap (Dual-Stage)** dipadukan dengan **Mesin Sortasi (Grading Engine)**.

### 1. YOLO 1 (Instance Segmentation) - Sang Pemotong
Tugas model ini hanyalah mengenali bentuk asli komoditas dan "mengguntingnya" (*masking*) dari lingkungan sekitarnya. Seluruh latar belakang diubah menjadi putih bersih (*auto-masking*).
- Menghilangkan *noise* (bayangan, tangan, meja).
- Memungkinkan perhitungan geometri yang presisi (panjang, rasio, tingkat kebulatan/circularity, dan keparahan cacat).

### 2. YOLO 2 (Classification) - Sang Pendeteksi Penyakit
Tugas model ini adalah menganalisa gambar yang sudah dipotong dan dibersihkan oleh YOLO 1 untuk mendeteksi penyakit/pembusukan pada kulit luar komoditas. Model ini sangat fokus pada tekstur permukaan buah/sayur.

### 3. Grading Engine (JSON Rule-Based) - Sang Pengambil Keputusan
Keputusan akhir (*Grade*) tidak diambil secara buta oleh AI. Kami menggunakan mesin aturan (berbasis file konfigurasi JSON) untuk menggabungkan hasil prediksi AI dengan pengukuran geometri secara dinamis, contohnya:
- Jika `sehat` namun ukuran terlalu kecil -> **Grade B**
- Jika `sehat` dan lonjong sempurna -> **Grade A**
- Jika luasan bercak / pembusukan (dari YOLO) melebihi batas -> **REJECT**

## 📊 Rapor Akurasi YOLO 2 (Klasifikasi Penyakit & Mutu)
Model klasifikasi terbaru kami dilatih menggunakan dataset yang sudah melalui proses "cuci bersih" (latar putih), menghasilkan akurasi yang luar biasa tanpa mengalami *overfitting*.

| Komoditas | Akurasi Validasi | Kondisi | Status Model |
| :--- | :--- | :--- | :--- |
| **Tomat (Tomato)** | **96,5%** | Latar Putih Bersih | Sangat Stabil ✅ |
| **Timun (Cucumber)** | **96,4%** | Latar Putih Bersih | Sangat Stabil ✅ |
| **Wortel (Carrot)** | **100,0%** | Latar Putih Bersih | Sempurna ✅ |
| **Cabai (Chili)** | *Tahap Pelatihan* | Latar Putih Bersih | (Sedang dalam proses *training*) ⏳ |

## 📂 Rekapitulasi Dataset (Data Training)
Sistem ini menggunakan dua himpunan data terpisah untuk melatih kedua otaknya:

### 1. Dataset YOLO 1 (Segmentasi Poligon)
Dataset ini murni ditujukan agar AI bisa mengenali dan menggunting bentuk sayuran. Semua kelas varietas turunan telah **dilebur menjadi 1 kelas tunggal** (contoh: *banana pepper* & *bird-s eye chili* dilebur menjadi kelas `0: chili`) agar AI fokus pada deteksi bentuk buah.
- **Cabai (Chili):** 6.675 gambar poligon (Penggabungan dataset lama & baru)
- **Tomat (Tomato):** ~9.790 gambar poligon
- **Timun (Cucumber):** ~1.250 gambar poligon
- **Wortel (Carrot):** ~788 gambar poligon

### 2. Dataset YOLO 2 (Klasifikasi Sehat vs Busuk)
Dataset ini dipotong (*crop*) secara ketat dan difilter agar hanya berisi area kulit komoditas untuk mendeteksi pembusukan/penyakit.
- **Cabai (Chili):** 313 gambar (*crop* ketat: 150 sehat, 163 busuk)
- **Komoditas Lainnya:** Menggunakan metode *Auto-Masking* latar putih bersih via `prepare_dataset.py`.

## 📁 Struktur Repositori Utama
- `ai_engine/export_models/` : Direktori penyimpanan model hasil *training* (YOLO 1 `.pt` dan YOLO 2 `.pt`).
- `ai_engine/grading_configs/` : Kumpulan aturan batas standar (JSON) penentuan mutu untuk masing-masing varietas.
- `ai_engine/model.py` : Mesin utama *Inference* yang memadukan YOLO 1, Masking, ekstraksi geometri, dan YOLO 2.
- `ai_engine/grading_engine.py` : Logika kalkulasi geometri (*solidity*, *circularity*) dan eksekusi aturan JSON.
- `ai_engine/test_integration.py` : *Script* untuk menyimulasikan dan melihat hasil grading akhir pada suatu gambar.
- `ai_engine/prepare_dataset.py` : Alat pencuci otomatis (*auto-masking*) yang menyulap dataset mentah menjadi dataset berlatar putih untuk dilatih ke YOLO 2.

## 💻 Cara Menguji Coba (Inference)
Jalankan *script* simulasi integrasi kami untuk melihat langsung kehebatan mesin pemisah mutu:

```bash
cd ai_engine
python test_integration.py
```
*Script* ini akan memuat model terbaru dari `export_models`, membaca aturan JSON di `grading_configs`, memproses gambar uji, dan mengeluarkan detail evaluasinya secara *real-time*.

## 🛠️ Persyaratan Sistem
- Python >= 3.10
- Ultralytics (YOLOv11)
- OpenCV (`cv2`)
- NumPy
- PyTorch (direkomendasikan versi CUDA untuk deteksi *real-time*)
