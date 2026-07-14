import cv2
import numpy as np
import json
import os
from pathlib import Path

class GradingEngine:
    def __init__(self, commodity="tomato"):
        self.commodity = commodity
        self.config = self._load_config()

    def _load_config(self):
        # Cari file konfigurasi di folder grading_configs
        config_path = Path(__file__).parent / "grading_configs" / f"{self.commodity}.json"
        if config_path.exists():
            with open(config_path, "r") as f:
                return json.load(f)
        else:
            print(f"Warning: {config_path} tidak ditemukan! Menggunakan default.")
            # Fallback default
            return {
                "min_area_A": 15000,
                "min_area_B": 8000,
                "min_circularity_A": 0.8,
                "min_circularity_B": 0.6,
                "hue_ranges": {}
            }

    def _check_color(self, hue):
        # Mencocokkan nilai Hue dengan rentang di config
        for status, ranges in self.config.get("hue_ranges", {}).items():
            for r in ranges:
                if r[0] <= hue <= r[1]:
                    # Berikan score berdasarkan status kematangan
                    score = 3 if "matang" in status or "segar" in status or "bagus" in status else 1
                    if "setengah" in status or "pucat" in status:
                        score = 2
                    return status.replace("_", " ").title(), score
        return "Unknown Color", 0

    def evaluate(self, image, mask_contour, pixel_ratio=1.0):
        result = {
            "grade": "C",
            "area_pixel": 0,
            "area_mm2": 0.0,
            "circularity": 0.0,
            "color_status": "Unknown",
            "hue_avg": 0
        }

        if mask_contour is None or len(mask_contour) < 5:
            return result

        # 1. Hitung UKURAN
        area_pixel = cv2.contourArea(mask_contour)
        area_mm2 = area_pixel * pixel_ratio
        
        result["area_pixel"] = area_pixel
        result["area_mm2"] = area_mm2

        # 2. Hitung BENTUK (Circularity)
        perimeter = cv2.arcLength(mask_contour, True)
        if perimeter == 0:
            circularity = 0
        else:
            circularity = (4 * np.pi * area_pixel) / (perimeter * perimeter)
        result["circularity"] = circularity

        # 3. Hitung WARNA (Color Kematangan)
        h, w = image.shape[:2]
        mask_img = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(mask_img, [mask_contour], -1, 255, -1)
        hsv_img = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        mean_hsv = cv2.mean(hsv_img, mask=mask_img)
        mean_hue = mean_hsv[0]
        result["hue_avg"] = mean_hue

        color_status, color_score = self._check_color(mean_hue)
        result["color_status"] = color_status

        # 4. KEPUTUSAN GRADING (Berdasarkan area_mm2 Nyata)
        if area_mm2 >= self.config["min_area_A"] and circularity >= self.config["min_circularity_A"] and color_score == 3:
            result["grade"] = "A (Premium)"
        elif area_mm2 >= self.config["min_area_B"] and circularity >= self.config["min_circularity_B"] and color_score >= 2:
            result["grade"] = "B (Standar)"
        else:
            result["grade"] = "C (Reject/Mentah)"

        return result


# --- SCRIPT TESTER (Hanya dijalankan jika file ini dieksekusi langsung) ---
if __name__ == "__main__":
    print("Testing Grading Engine OpenCV...")
    # Nanti kita akan tes dengan gambar asli dan kontur palsu atau YOLO
    engine = GradingEngine("tomato")
    print("Engine siap digunakan oleh PWA Backend!")
