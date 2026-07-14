import cv2
import numpy as np

class AutoCalibrator:
    def __init__(self, ref_area_mm2=572.5):
        # Default: Koin Rp 500 (Kuning/Baru). Diameter 27mm -> Luas = pi * (13.5)^2 = 572.55 mm2
        self.ref_area_mm2 = ref_area_mm2

    def get_pixel_ratio(self, image, roi=None):
        """
        Mencari objek koin di gambar dan mengembalikan rasio (mm2 per pixel).
        Jika 'roi' (Region of Interest) diberikan (x, y, w, h), pencarian koin 
        HANYA dilakukan di dalam kotak tersebut agar tidak tertukar dengan tomat bulat.
        """
        if roi is not None:
            x, y, w, h = roi
            # Potong gambar hanya pada area panduan UI koin
            search_area = image[y:y+h, x:x+w]
            offset_x, offset_y = x, y
        else:
            search_area = image
            offset_x, offset_y = 0, 0

        gray = cv2.cvtColor(search_area, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)
        
        # Deteksi Tepi
        edges = cv2.Canny(blurred, 30, 150)
        
        # Tutup celah tepi agar koin utuh
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        # Cari kontur
        contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        best_coin_area = None
        best_circularity = 0
        best_contour = None
        
        for c in contours:
            area = cv2.contourArea(c)
            # Batasan masuk akal untuk ukuran koin di kamera
            if area < 500 or area > 100000: 
                continue
                
            perimeter = cv2.arcLength(c, True)
            if perimeter == 0:
                continue
                
            circularity = (4 * np.pi * area) / (perimeter ** 2)
            
            # Cari objek yang paling bulat (Koin)
            if circularity > 0.82: # Toleransi kemiringan/pantulan
                if circularity > best_circularity:
                    best_circularity = circularity
                    best_coin_area = area
                    best_contour = c
                    
        if best_coin_area is not None:
            # Kembalikan koordinat kontur ke posisi gambar asli jika menggunakan ROI
            if roi is not None:
                best_contour = best_contour + [offset_x, offset_y]
                
            # Berhasil menemukan koin
            # Rasio = Luas asli koin (mm2) / Luas koin di gambar (Piksel)
            ratio = self.ref_area_mm2 / best_coin_area
            return ratio, best_contour
            
        # Jika koin tidak terdeteksi (Gagal kalibrasi)
        # Fallback rasio statis sementara (asumsi jarak kamera standar)
        return 0.5, None
