import cv2
import numpy as np
import sys
from pathlib import Path
from ultralytics import YOLO

# Tambahkan path ai_engine agar bisa import modul
sys.path.append(str(Path(__file__).parent))
from grading_engine import GradingEngine
from calibration import AutoCalibrator

print("Memuat AI Spesialis Tomat...")
model = YOLO("export_models/tomato_best.pt")
grader = GradingEngine("tomato")
calibrator = AutoCalibrator()

img_path = "dataset-tomato/valid/images/test_IMG_1171_jpg.rf.bc6a1a16a1b4f6b1ff4664381f0270fb.jpg"
img = cv2.imread(img_path)
if img is None:
    print(f"Error: Gambar {img_path} tidak ditemukan!")
    exit()

height, width = img.shape[:2]
if width > 1024:
    scale = 1024 / width
    img = cv2.resize(img, (1024, int(height * scale)))

# 1. Tahap Kalibrasi Koin
print("Mencari Koin Rp500 untuk kalibrasi jarak kamera...")
pixel_ratio, coin_contour = calibrator.get_pixel_ratio(img)
print(f"Rasio Skala Didapat: 1 piksel = {pixel_ratio:.4f} mm2")

annotated_img = img.copy()

# Jika koin ketemu, gambar koin dengan warna biru
if coin_contour is not None:
    cv2.drawContours(annotated_img, [coin_contour], -1, (255, 0, 0), 2)
    cv2.putText(annotated_img, "KOIN", (coin_contour[0][0][0], coin_contour[0][0][1] - 10), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

print(f"Menganalisis gambar dengan OpenCV Grading Engine...")
results = model.predict(source=img, save=False, verbose=False)

for r in results:
    if r.masks is not None:
        for i, mask_xy in enumerate(r.masks.xy):
            contour = np.array(mask_xy, dtype=np.int32).reshape((-1, 1, 2))
            
            # Panggil Algoritma Grading dengan Rasio Piksel
            grade_result = grader.evaluate(img, contour, pixel_ratio)
            grade = grade_result['grade']
            area_mm2 = grade_result['area_mm2']
            
            if grade_result['area_pixel'] < 1000:
                continue

            cv2.drawContours(annotated_img, [contour], -1, (0, 255, 0), 2)
            
            M = cv2.moments(contour)
            if M["m00"] != 0:
                cX = int(M["m10"] / M["m00"])
                cY = int(M["m01"] / M["m00"])
            else:
                cX, cY = contour[0][0][0], contour[0][0][1]

            if "A" in grade: color = (0, 255, 0)
            elif "B" in grade: color = (0, 255, 255)
            else: color = (0, 0, 255)

            cv2.putText(annotated_img, f"Grade: {grade[:1]}", (cX - 40, cY), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 3)
            
            print(f"\n🍅 Tomat {i+1}:")
            print(f"   - Luas (Area)      : {area_mm2:.1f} mm2")
            print(f"   - Bentuk (Bulat)   : {grade_result['circularity']:.2f}")
            print(f"   - Warna (Hue)      : {grade_result['hue_avg']:.0f} -> {grade_result['color_status']}")
            print(f"   => KEPUTUSAN GRADE : {grade}")

cv2.imwrite("grading_result.jpg", annotated_img)
print("\nSelesai! Hasil visualisasi disimpan di 'grading_result.jpg'")
