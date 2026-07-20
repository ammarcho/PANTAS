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
        self.yolo2_models = {}
        self.calibrator = AutoCalibrator()

    def _get_yolo_model(self, commodity: str):
        """Mekanisme Caching: Load model hanya jika belum ada di memori."""
        if commodity not in self.yolo_models:
            model_path = ROOT_DIR / "export_models" / f"{commodity}_seg.pt"
            if not model_path.exists():
                raise FileNotFoundError(f"Model YOLO untuk '{commodity}' tidak ditemukan di {model_path}")
            self.yolo_models[commodity] = YOLO(str(model_path))
        return self.yolo_models[commodity]

    def _get_yolo2_model(self, commodity: str):
        """Mekanisme Caching: Load model YOLO 2 (Klasifikasi) hanya jika belum ada di memori."""
        if commodity not in self.yolo2_models:
            model_path = ROOT_DIR / "export_models" / f"{commodity}_cls.pt"
            if not model_path.exists():
                raise FileNotFoundError(f"Model YOLO 2 (Klasifikasi) untuk '{commodity}' tidak ditemukan di {model_path}")
            self.yolo2_models[commodity] = YOLO(str(model_path))
        return self.yolo2_models[commodity]

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
        import hashlib
        import json
        
        # 0. Gerbang Kualitas Foto (Cek Blur)
        gray_img = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray_img, cv2.CV_64F).var()
        if blur_score < 10:
            return {
                "status": "error", 
                "message": f"Foto ditolak (terlalu blur). Skor ketajaman {int(blur_score)} di bawah standar."
            }, img_array

        commodity_base = commodity_specific.split("_")[0]
        model = self._get_yolo_model(commodity_base)
        model_cls = self._get_yolo2_model(commodity_base)
        grader = GradingEngine(commodity_specific)
        
        # 1. Kalibrasi Kamera dengan Koin
        pixel_ratio, coin_contour = self.calibrator.get_pixel_ratio(img_array, roi=roi)
        is_calibrated = coin_contour is not None
        
        annotated_img = img_array.copy()
        
        # Gambar panduan koin
        if is_calibrated:
            cv2.drawContours(annotated_img, [coin_contour], -1, (255, 0, 0), 2)
            cv2.putText(annotated_img, "KOIN", (coin_contour[0][0][0], coin_contour[0][0][1] - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        # 2. Prediksi AI (YOLO Segmentasi)
        results = model.predict(source=img_array, save=False, verbose=False)
        grading_results = []
        
        # 3. Ekstraksi Fakta & Rule Engine
        for r in results:
            if r.masks is not None:
                for i, mask_xy in enumerate(r.masks.xy):
                    contour = np.array(mask_xy, dtype=np.int32).reshape((-1, 1, 2))
                    
                    if cv2.contourArea(contour) < 500:
                        continue 

                    # OpenCV Rule Engine Berjalan
                    grade_result = grader.evaluate(img_array, contour, pixel_ratio)
                    grade = grade_result['grade']
                    
                    # Konversi bounding box untuk cacat (simplified)
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # --- INTERVENSI YOLO 2 (AHLI PATOLOGI) ---
                    # Buat mask dari contour
                    mask_img = np.zeros(img_array.shape[:2], dtype=np.uint8)
                    cv2.drawContours(mask_img, [contour], -1, 255, -1)
                    
                    # Trik Cerdas: Ubah latar belakang menjadi PUTIH (Bukan Hitam)
                    # Karena YOLO 2 dilatih dengan gambar Google (latar putih = sehat)
                    tomato_only_img = np.full_like(img_array, (255, 255, 255))
                    cv2.copyTo(src=img_array, mask=mask_img, dst=tomato_only_img)
                    
                    # Tambahkan padding 10% agar buah tidak terpotong ketat
                    pad_x = int(w * 0.1)
                    pad_y = int(h * 0.1)
                    img_h, img_w = tomato_only_img.shape[:2]
                    
                    crop_x1 = max(0, x - pad_x)
                    crop_y1 = max(0, y - pad_y)
                    crop_x2 = min(img_w, x + w + pad_x)
                    crop_y2 = min(img_h, y + h + pad_y)
                    
                    # Crop dari gambar yang sudah bersih dari latar belakang
                    crop_img = tomato_only_img[crop_y1:crop_y2, crop_x1:crop_x2]
                    
                    # Prediksi kesehatan menggunakan YOLO 2
                    if crop_img.shape[0] > 0 and crop_img.shape[1] > 0:
                        yolo2_res = model_cls.predict(source=crop_img, save=False, verbose=False)[0]
                        top_class_idx = yolo2_res.probs.top1
                        top_class_name = yolo2_res.names[top_class_idx]
                        top_class_conf = float(yolo2_res.probs.top1conf)
                        
                        # Terapkan Logika VETO (Saksi Konfirmasi, bukan Hakim Mutlak)
                        VETO_CONF_MIN = 0.85
                        has_bercak = any(
                            c["jenis"] in ("bercak_busuk", "bercak_ringan")
                            for c in grade_result["cacat"]
                        )
                        
                        if (top_class_name == "busuk" 
                                and top_class_conf >= VETO_CONF_MIN 
                                and has_bercak):
                            if "REJECT" not in grade:
                                grade = "REJECT"
                                grade_result['grade'] = "REJECT"
                                grade_result['alasan_grade'].append(f"VETO YOLO 2: Terdeteksi penyakit/busuk ({top_class_conf*100:.1f}%)")
                    else:
                        top_class_name = "unknown"
                        top_class_conf = 0.0
                    # ----------------------------------------
                    
                    grading_results.append({
                        "id": i + 1,
                        "grade": grade,
                        "ukuran_mm2": round(grade_result['area_mm2'], 1) if is_calibrated else None,
                        "solidity": round(grade_result['solidity'], 2),
                        "circularity": round(grade_result['circularity'], 2),
                        "color_status": grade_result['color_status'],
                        "color_score": grade_result.get('color_score', 0),
                        "cacat": grade_result['cacat'],
                        "alasan_grade": grade_result['alasan_grade'],
                        "yolo2_kondisi": top_class_name,
                        "yolo2_conf": round(top_class_conf, 2),
                        "bbox": [x, y, w, h]
                    })

                    # Visualisasi Bounding Box & Grade
                    if "A" in grade: color = (0, 255, 0)
                    elif "B" in grade: color = (0, 255, 255)
                    elif "C" in grade: color = (0, 0, 255)
                    else: color = (0, 0, 255) # REJECT = Merah terang

                    cv2.drawContours(annotated_img, [contour], -1, color, 2)
                    
                    M = cv2.moments(contour)
                    if M["m00"] != 0:
                        cX = int(M["m10"] / M["m00"])
                        cY = int(M["m01"] / M["m00"])
                    else:
                        cX, cY = contour[0][0][0], contour[0][0][1]

                    txt = f"{grade[:1]}" if "REJECT" not in grade else "X"
                    cv2.putText(annotated_img, txt, (cX - 15, cY), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # Hitung Ringkasan Batch
        total_obj = len(grading_results)
        grade_counts = {"A": 0, "B": 0, "C": 0, "REJECT": 0}
        for res in grading_results:
            g = res["grade"][0] if "REJECT" not in res["grade"] else "REJECT"
            if g in grade_counts: grade_counts[g] += 1
            
        komposisi = {k: round(v/total_obj, 2) for k, v in grade_counts.items()} if total_obj > 0 else {}

        # Hitung Skor Keseragaman dari std dev ukuran
        if total_obj > 1:
            sizes = [r['ukuran_mm2'] if r['ukuran_mm2'] else r['bbox'][2] * r['bbox'][3] for r in grading_results]
            mean_size = np.mean(sizes)
            std_size = np.std(sizes)
            cv_coeff = std_size / mean_size if mean_size > 0 else 0
            skor_keseragaman = round(max(0, 1 - cv_coeff), 2)
        else:
            skor_keseragaman = 1.0

        # Struktur Output Final (Sesuai Proposal)
        dict_results = {
            "status": "success",
            "komoditas": commodity_specific,
            "objek_terdeteksi": total_obj,
            "kalibrasi": {
                "referensi": "koin_500",
                "px_per_mm2": round(pixel_ratio, 4),
                "valid": is_calibrated
            },
            "ringkasan_batch": {
                "komposisi": komposisi,
                "skor_keseragaman": skor_keseragaman
            },
            "objek": grading_results
        }
        
        # Buat Hash Audit (SHA256 dari JSON string)
        json_str = json.dumps(dict_results, sort_keys=True)
        dict_results["hash_audit"] = "sha256:" + hashlib.sha256(json_str.encode()).hexdigest()
        
        return dict_results, annotated_img
