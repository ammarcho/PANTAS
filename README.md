# PANTAS - Sistem Penyortir Sayur Cerdas (Single-Class YOLOv11) 🌶️🍅🥕🥒

PANTAS adalah sistem cerdas berbasis *Computer Vision* (YOLOv11 Instance Segmentation) yang dirancang untuk kebutuhan industri penyortiran komoditas sayuran. Sistem ini mampu mengenali dan memotong (*segment*) objek secara akurat secara *real-time* menggunakan kamera.

## 🚀 Pendekatan "AI Spesialis" (Single-Class)
Pada awalnya, sistem ini dirancang menggunakan 1 model gabungan raksasa untuk memproses 4 komoditas sekaligus. Namun, untuk mengatasi masalah **halusinasi kelas** (misal: tomat salah ditebak sebagai cabai) dan **bottleneck memori (CUDA OOM)** saat menangani 50.000+ dataset gambar, arsitektur sistem dirombak menjadi pendekatan **Single-Class Specialist**.

Kami melatih 4 buah "Otak AI Spesialis" yang berbeda. Setiap model secara eksklusif hanya mempelajari 1 jenis komoditas, sehingga akurasi segmentasinya melesat drastis dan bebas dari kesalahan silang antar komoditas.

## 📊 Rapor Akurasi Model (Evaluasi Akhir)
Seluruh model dilatih menggunakan YOLOv11-seg dengan pendekatan `imgsz=416` dan `batch=8` untuk mengoptimalkan kecepatan *training* tanpa mengorbankan kualitas.

| Komoditas | Dataset (Gambar) | Precision | Recall | mAP50 (Mask) | Status / Epoch |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cabai (Chili)** | ~6.400 | **97,6%** | **95,9%** | **97,1%** | Sempurna (Epoch 37 - Early Stop) |
| **Timun (Cucumber)** | ~1.250 | **95,9%** | **89,8%** | **96,0%** | Sangat Tajam (Epoch 100) |
| **Tomat (Tomato)** | ~9.790 | **94,5%** | **84,5%** | **90,3%** | Sangat Baik (Epoch 100) |
| **Wortel (Carrot)** | ~788 | **91,1%** | **78,1%** | **87,4%** | Sangat Bagus (Epoch 100) |

*Catatan: Kecepatan inferensi (deteksi) hanya memakan waktu rata-rata **60ms - 80ms** per frame, sangat siap untuk kecepatan ban berjalan (conveyor belt) industri.*

## 📁 Struktur Repositori
- `export_models/` : Berisi 4 file bobot model AI (`*_best.pt`) yang sudah matang dan siap pakai.
- `webcam.py` : Script antarmuka (CLI) untuk menjalankan kamera *real-time* atau tes gambar. Anda cukup memilih angka 1-4 untuk memuat AI Spesialis yang dibutuhkan.
- `train_all.py` : Script *watchdog* untuk melakukan *queue training* otomatis secara berurutan.
- `train_model.py` : Modul utama untuk melatih model YOLOv11 secara individual.

## 💻 Cara Menggunakan (Inference)
Pastikan Anda memiliki *webcam* atau gambar (*image*) yang ingin diuji, lalu jalankan:

```bash
python webcam.py
```
Menu akan muncul di terminal. Pilih komoditas yang ingin disortir:
```text
========================================
SISTEM PENYORTIR PANTAS (SINGLE-CLASS)
========================================
Pilih komoditas yang akan disortir:
1. Cabai (Chili)
2. Tomat (Tomato)
3. Wortel (Carrot)
4. Timun (Cucumber)
Masukkan angka pilihan Anda (1-4): 2
```
Sistem akan otomatis memuat file `tomato_best.pt` dan mulai menyeleksi objek!

## 🛠️ Persyaratan Sistem
- Python >= 3.10
- Ultralytics (YOLO)
- OpenCV
- PyTorch (direkomendasikan versi CUDA untuk deteksi *real-time*)
