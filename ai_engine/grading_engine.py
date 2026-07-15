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
            "solidity": 0.0,
            "color_status": "Unknown",
            "hue_avg": 0,
            "cacat": [],
            "alasan_grade": []
        }

        if mask_contour is None or len(mask_contour) < 5:
            return result

        # 1. Hitung UKURAN
        area_pixel = cv2.contourArea(mask_contour)
        area_mm2 = area_pixel * pixel_ratio
        
        result["area_pixel"] = area_pixel
        result["area_mm2"] = area_mm2

        # 2. Hitung BENTUK (Circularity & Solidity)
        perimeter = cv2.arcLength(mask_contour, True)
        circularity = (4 * np.pi * area_pixel) / (perimeter * perimeter) if perimeter > 0 else 0
        result["circularity"] = circularity
        
        hull = cv2.convexHull(mask_contour)
        hull_area = cv2.contourArea(hull)
        solidity = area_pixel / hull_area if hull_area > 0 else 0
        result["solidity"] = solidity

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

        # 4. Deteksi CACAT (Hitam/Busuk)
        lower_dark = np.array([0, 0, 0])
        upper_dark = np.array([180, 255, 70]) # Threshold untuk hitam/coklat gelap
        dark_mask = cv2.inRange(hsv_img, lower_dark, upper_dark)
        defect_roi = cv2.bitwise_and(dark_mask, dark_mask, mask=mask_img)
        defect_pixels = cv2.countNonZero(defect_roi)
        luas_persen_cacat = (defect_pixels / area_pixel) * 100 if area_pixel > 0 else 0
        
        cacat_list = []
        is_reject = False
        
        if luas_persen_cacat > 5:
            cacat_list.append({"jenis": "bercak_busuk", "tipe": "patologis", "luas_persen": round(luas_persen_cacat, 1)})
            is_reject = True
        elif luas_persen_cacat > 0.5:
            cacat_list.append({"jenis": "bercak_ringan", "tipe": "kosmetik", "luas_persen": round(luas_persen_cacat, 1)})
            
        if solidity < 0.90:
            cacat_list.append({"jenis": "deformasi_bentuk", "tipe": "kosmetik", "luas_persen": 0})
            
        result["cacat"] = cacat_list

        # 5. KEPUTUSAN GRADING (Rule Engine & Alasan)
        alasan = []
        if is_reject:
            result["grade"] = "REJECT"
            alasan.append(f"Cacat patologis (busuk) mencapai {round(luas_persen_cacat,1)}% area -> REJECT mutlak")
        else:
            min_a = self.config["min_area_A"]
            min_b = self.config["min_area_B"]
            
            # Anchor ukuran
            if area_mm2 >= min_a:
                grade_final = "A"
                alasan.append(f"Ukuran {int(area_mm2)}mm2 >= ambang Grade A ({min_a}mm2)")
            elif area_mm2 >= min_b:
                grade_final = "B"
                alasan.append(f"Ukuran {int(area_mm2)}mm2 masuk rentang Grade B ({min_b}-{min_a}mm2)")
            else:
                grade_final = "C"
                alasan.append(f"Ukuran {int(area_mm2)}mm2 < ambang Grade B ({min_b}mm2)")
                
            # Downgrade warna
            if color_score < 3:
                if grade_final in ["A", "B"]:
                    grade_final = "C" if color_score == 1 else "B"
                alasan.append(f"Warna belum matang sempurna ({color_status}) menurunkan grade")
                
            # Downgrade cacat kosmetik
            if any(c["tipe"] == "kosmetik" for c in cacat_list):
                if grade_final == "A":
                    grade_final = "B"
                alasan.append(f"Terdapat cacat kosmetik (penyok/bercak ringan), diturunkan maksimal Grade B")

            if grade_final == "A": result["grade"] = "A (Premium)"
            elif grade_final == "B": result["grade"] = "B (Standar)"
            else: result["grade"] = "C (Mentah/Kecil)"
            
        result["alasan_grade"] = alasan
        return result


# --- SCRIPT TESTER (Hanya dijalankan jika file ini dieksekusi langsung) ---
if __name__ == "__main__":
    print("Testing Grading Engine OpenCV...")
    # Nanti kita akan tes dengan gambar asli dan kontur palsu atau YOLO
    engine = GradingEngine("tomato")
    print("Engine siap digunakan oleh PWA Backend!")
