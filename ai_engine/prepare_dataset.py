"""
Script untuk "mencuci" dataset YOLO 2 (Klasifikasi) yang diunduh dari internet.

Langkah kerja:
1. Baca setiap gambar dari folder dataset lama (yolo2_classification/tomato)
2. Jalankan YOLO 1 (Segmentasi) untuk menemukan kontur buah
3. Gunting buah dari latar belakang menggunakan mask
4. Tempel buah di atas kanvas PUTIH bersih
5. Simpan ke folder dataset baru (yolo2_ready/tomato)
6. Seimbangkan jumlah kelas (sehat vs busuk)

Hasil: Dataset yang bersih, tanpa bias latar belakang, siap untuk retrain YOLO 2.
"""

import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
import shutil
import random

# === KONFIGURASI ===
COMMODITIES = ["tomato", "carrot", "chili", "cucumber"]
BASE_LAMA = Path(__file__).parent / "datasets" / "yolo2_classification"
BASE_BARU = Path(__file__).parent / "datasets" / "yolo2_ready"
MODELS_DIR = Path(__file__).parent / "export_models"
MAX_PER_CLASS = 900  # Maksimal gambar per kelas (untuk balancing)
IMG_SIZE = 224       # Ukuran output gambar (YOLO 2 classification standard)


def mask_and_whitebg(img, model):
    """
    Deteksi buah dengan YOLO 1, gunting dengan mask, tempel di kanvas putih.
    
    Returns:
        list of numpy arrays (satu per buah yang terdeteksi), atau [] jika tidak ada.
    """
    results = model.predict(source=img, save=False, verbose=False)
    cropped_images = []
    
    for r in results:
        if r.masks is None:
            continue
        for mask_xy in r.masks.xy:
            contour = np.array(mask_xy, dtype=np.int32).reshape((-1, 1, 2))
            
            if cv2.contourArea(contour) < 500:
                continue
            
            # Buat mask dari contour
            mask = np.zeros(img.shape[:2], dtype=np.uint8)
            cv2.drawContours(mask, [contour], -1, 255, -1)
            
            # Buat kanvas putih
            white_bg = np.full_like(img, (255, 255, 255))
            
            # Salin hanya area buah ke kanvas putih
            cv2.copyTo(src=img, mask=mask, dst=white_bg)
            
            # Crop ke bounding box + padding 10%
            x, y, w, h = cv2.boundingRect(contour)
            pad_x = int(w * 0.1)
            pad_y = int(h * 0.1)
            img_h, img_w = white_bg.shape[:2]
            
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(img_w, x + w + pad_x)
            y2 = min(img_h, y + h + pad_y)
            
            crop = white_bg[y1:y2, x1:x2]
            
            if crop.shape[0] > 0 and crop.shape[1] > 0:
                # Resize ke ukuran standar
                crop_resized = cv2.resize(crop, (IMG_SIZE, IMG_SIZE))
                cropped_images.append(crop_resized)
    
    return cropped_images


def process_class(model, class_dir, output_base, class_name, split):
    """
    Proses semua gambar dalam satu folder kelas (sehat/busuk).
    """
    output_dir = output_base / split / class_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    image_files = [f for f in class_dir.iterdir() if f.suffix.lower() in image_extensions]
    
    saved_count = 0
    skipped_count = 0
    
    for img_path in image_files:
        try:
            img = cv2.imread(str(img_path))
            if img is None:
                skipped_count += 1
                continue
            
            crops = mask_and_whitebg(img, model)
            
            if not crops:
                # YOLO 1 tidak menemukan buah — skip gambar ini
                skipped_count += 1
                continue
            
            # Simpan crop pertama saja (1 buah per gambar)
            out_path = output_dir / f"clean_{img_path.stem}.jpg"
            cv2.imwrite(str(out_path), crops[0])
            saved_count += 1
            
        except Exception as e:
            skipped_count += 1
            continue
    
    return saved_count, skipped_count


def balance_dataset(dataset_dir):
    """
    Seimbangkan jumlah gambar antar kelas di setiap split (train/val).
    Hapus gambar berlebih secara acak dari kelas yang jumlahnya lebih banyak.
    """
    for split in ['train', 'val']:
        split_dir = dataset_dir / split
        if not split_dir.exists():
            continue
        
        classes = [d for d in split_dir.iterdir() if d.is_dir()]
        if len(classes) < 2:
            continue
        
        # Hitung jumlah per kelas
        class_counts = {}
        for cls_dir in classes:
            files = list(cls_dir.glob("*.*"))
            class_counts[cls_dir.name] = files
        
        # Tentukan batas: minimum dari (MAX_PER_CLASS, kelas terkecil)
        min_count = min(len(files) for files in class_counts.values())
        target = min(MAX_PER_CLASS, min_count)
        
        print(f"\n  [{split}] Target per kelas: {target} gambar")
        
        for cls_name, files in class_counts.items():
            if len(files) > target:
                # Hapus file berlebih secara acak
                random.shuffle(files)
                to_remove = files[target:]
                for f in to_remove:
                    f.unlink()
                print(f"    {cls_name}: {len(files)} -> {target} (hapus {len(to_remove)})")
            else:
                print(f"    {cls_name}: {len(files)} (tetap)")


def main():
    print("=" * 60)
    print("  PANTAS Dataset Cleaner (Auto-Masking + White Background)")
    print("=" * 60)
    
    for komoditas in COMMODITIES:
        print(f"\n\n>>> MEMULAI PROSES KOMODITAS: {komoditas.upper()} <<<")
        
        yolo1_model = MODELS_DIR / f"{komoditas}_seg.pt"
        dataset_lama = BASE_LAMA / komoditas
        dataset_baru = BASE_BARU / komoditas
        
        # Cek model YOLO 1
        if not yolo1_model.exists():
            print(f"  [SKIP] Model YOLO 1 tidak ditemukan: {yolo1_model.name}")
            continue
        
        # Cek dataset lama
        if not dataset_lama.exists():
            print(f"  [SKIP] Dataset lama tidak ditemukan: {dataset_lama.name}")
            continue
        
        # Bersihkan folder output jika sudah ada
        if dataset_baru.exists():
            print(f"  [INFO] Menghapus dataset lama di {dataset_baru}...")
            shutil.rmtree(dataset_baru)
        
        # Load model YOLO 1
        print(f"\n  [1/4] Memuat model YOLO 1: {yolo1_model.name}")
        model = YOLO(str(yolo1_model))
        
        # Proses setiap split dan kelas
        print(f"\n  [2/4] Memproses gambar (masking + white background)...")
        total_saved = 0
        total_skipped = 0
        
        for split in ['train', 'val']:
            split_dir = dataset_lama / split
            if not split_dir.exists():
                print(f"    [SKIP] Folder {split} tidak ditemukan.")
                continue
            
            for class_dir in sorted(split_dir.iterdir()):
                if not class_dir.is_dir():
                    continue
                
                class_name = class_dir.name
                print(f"    Memproses [{split}/{class_name}]...", end="", flush=True)
                
                saved, skipped = process_class(model, class_dir, dataset_baru, class_name, split)
                total_saved += saved
                total_skipped += skipped
                
                print(f" Berhasil: {saved}, Dilewati: {skipped}")
        
        print(f"\n  [3/4] Total gambar bersih {komoditas.upper()}: {total_saved}, Dilewati: {total_skipped}")
        
        # Balancing
        print(f"\n  [4/4] Menyeimbangkan jumlah kelas untuk {komoditas.upper()}...")
        balance_dataset(dataset_baru)
    
    # Laporan akhir
    print("\n" + "=" * 60)
    print("  SELESAI SEMUA KOMODITAS!")
    print(f"  Dataset baru tersimpan di: {BASE_BARU}")
    print("=" * 60)
    print("\nLangkah selanjutnya:")
    print("  Latih ulang YOLO 2 untuk SETIAP komoditas dengan perintah:")
    for komoditas in COMMODITIES:
        print(f"  yolo classify train model=yolov8n-cls.pt data=\"{BASE_BARU / komoditas}\" epochs=50 imgsz={IMG_SIZE}")


if __name__ == "__main__":
    main()
