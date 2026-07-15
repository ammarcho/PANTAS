import sys
from pathlib import Path
import cv2
import numpy as np

# Tambahkan path ai_engine agar bisa membaca modul lain di folder ini
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR))

from grading_engine import GradingEngine
from calibration import AutoCalibrator
from ultralytics import YOLO

class PantasModel:
    def __init__(self):
        """
        Sang Mandor AI (PantasModel).
        Bertugas memuat model YOLO ke dalam memori secara efisien dan
        mengorkestrasi GradingEngine serta AutoCalibrator.
        """
        self.yolo_models = {}
        self.calibrator = AutoCalibrator()

    def _get_yolo_model(self, commodity: str):
        """Mekanisme Caching: Load model hanya jika belum ada di memori."""
        if commodity not in self.yolo_models:
            model_path = ROOT_DIR / "export_models" / f"{commodity}_best.pt"
            if not model_path.exists():
                raise FileNotFoundError(f"Model YOLO untuk '{commodity}' tidak ditemukan di {model_path}")
            self.yolo_models[commodity] = YOLO(str(model_path))
        return self.yolo_models[commodity]

    def predict(self, img_array, commodity_specific: str, roi=None):
        """
        Fungsi Utama Inference AI.
        
        Args:
            img_array: numpy array dari OpenCV image (BGR).
            commodity_specific: Jenis komoditas spesifik (misal: "tomato_ceri", "chili_rawit").
            roi: Tuple (x, y, w, h) untuk kotak pencarian koin.
            
        Returns:
            dict_results: Dictionary berisi data analitik lengkap.
            annotated_img: Gambar OpenCV yang sudah digambar Bounding Box & Grade.
        """
        # Ekstrak kata pertama untuk mencari model YOLO generiknya (misal: "tomato_ceri" -> "tomato")
        commodity_base = commodity_specific.split("_")[0]
        
        model = self._get_yolo_model(commodity_base)
        grader = GradingEngine(commodity_specific)
        
        # 1. Kalibrasi Kamera dengan Koin
        pixel_ratio, coin_contour = self.calibrator.get_pixel_ratio(img_array, roi=roi)
        
        annotated_img = img_array.copy()
        
        # Gambar panduan koin jika ketemu
        if coin_contour is not None:
            cv2.drawContours(annotated_img, [coin_contour], -1, (255, 0, 0), 2)
            cv2.putText(annotated_img, "KOIN", (coin_contour[0][0][0], coin_contour[0][0][1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        # 2. Prediksi AI (YOLO)
        results = model.predict(source=img_array, save=False, verbose=False)
        grading_results = []
        
        # 3. Evaluasi Grading (OpenCV)
        for r in results:
            if r.masks is not None:
                for i, mask_xy in enumerate(r.masks.xy):
                    contour = np.array(mask_xy, dtype=np.int32).reshape((-1, 1, 2))
                    
                    if cv2.contourArea(contour) < 500:
                        continue # Abaikan noise kecil

                    grade_result = grader.evaluate(img_array, contour, pixel_ratio)
                    grade = grade_result['grade']
                    
                    grading_results.append({
                        "id": i + 1,
                        "grade": grade,
                        "area_mm2": round(grade_result['area_mm2'], 1),
                        "circularity": round(grade_result['circularity'], 2),
                        "color_status": grade_result['color_status']
                    })

                    # Visualisasi Grade
                    if "A" in grade: color = (0, 255, 0)
                    elif "B" in grade: color = (0, 255, 255)
                    else: color = (0, 0, 255)

                    cv2.drawContours(annotated_img, [contour], -1, color, 2)
                    
                    M = cv2.moments(contour)
                    if M["m00"] != 0:
                        cX = int(M["m10"] / M["m00"])
                        cY = int(M["m01"] / M["m00"])
                    else:
                        cX, cY = contour[0][0][0], contour[0][0][1]

                    cv2.putText(annotated_img, f"{grade[:1]}", (cX - 15, cY), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        dict_results = {
            "status": "success",
            "pixel_ratio": pixel_ratio,
            "coin_found": coin_contour is not None,
            "total_detected": len(grading_results),
            "results": grading_results
        }
        
        return dict_results, annotated_img
