import cv2
import numpy as np


class AutoCalibrator:
    """Mengubah luas koin Rp500 di foto menjadi rasio mm² per piksel."""

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
            # Koin sering meleset dari lingkaran panduan: video dirender
            # object-cover jadi apa yang dilihat petani bukan persis apa yang
            # terekam, plus tangan bergeser. Percobaan kedua melebarkan kotak
            # 2x sebelum menyerah — masih jauh dari tumpukan panen.
            attempts = [(roi, True), (self._grow(roi, image.shape, 2.0), True)]
        else:
            attempts = [(None, False)]

        for area, tight in attempts:
            found = self._detect(image, area, tight)
            if found is not None:
                coin_area_px, contour = found
                # Rasio = Luas asli koin (mm2) / Luas koin di gambar (Piksel)
                return self.ref_area_mm2 / coin_area_px, contour

        # Jika koin tidak terdeteksi (Gagal kalibrasi)
        # Fallback rasio statis sementara (asumsi jarak kamera standar)
        return 0.5, None

    # ------------------------------------------------------------------ #

    @staticmethod
    def _grow(roi, shape, factor):
        """Perbesar kotak ROI dari titik tengahnya, dipotong ke batas gambar."""
        x, y, w, h = roi
        cx, cy = x + w / 2, y + h / 2
        w, h = w * factor, h * factor
        x0, y0 = max(0, int(cx - w / 2)), max(0, int(cy - h / 2))
        x1, y1 = min(shape[1], int(cx + w / 2)), min(shape[0], int(cy + h / 2))
        return (x0, y0, x1 - x0, y1 - y0)

    def _detect(self, image, roi, tight):
        """Kembalikan (luas_px, kontur pada koordinat gambar asli) atau None."""
        if roi is not None:
            x, y, w, h = roi
            search = image[y:y + h, x:x + w]
            off_x, off_y = x, y
        else:
            search = image
            off_x, off_y = 0, 0

        if search.size == 0:
            return None

        gray = cv2.cvtColor(search, cv2.COLOR_BGR2GRAY)
        # Kernel blur ikut ukuran area. (11, 11) tetap adalah penyebab utama
        # "kalibrasi gagal": pada koin ~50 px tepinya ikut terhapus.
        k = max(3, min(int(min(search.shape[:2]) / 40) | 1, 11))
        blurred = cv2.GaussianBlur(gray, (k, k), 0)

        min_dim = min(search.shape[:2])
        if tight:
            # Di dalam kotak panduan koin mendominasi bingkai.
            min_r = max(6, int(min_dim * 0.08))
            max_r = max(min_r + 2, int(min_dim * 0.48))
        else:
            # Seluruh foto: koin hanya sepotong kecil dari bingkai.
            min_r = max(6, int(min_dim * 0.015))
            max_r = max(min_r + 2, int(min_dim * 0.25))

        # Kontur dulu: luasnya eksak. Ambangnya sengaja ketat — kontur yang
        # bolong separuh tetap "bulat" tapi luasnya kekecilan, dan itu diam-diam
        # membesarkan taksiran ukuran buah. Sisanya diserahkan ke Hough.
        found = self._contour_scan(blurred, off_x, off_y, min_r, max_r)
        if found is not None:
            return found

        circle = self._hough(blurred, min_r, max_r)
        if circle is not None:
            cx, cy, r = circle
            return float(np.pi * r * r), self._circle_contour(cx + off_x, cy + off_y, r)

        return None

    @staticmethod
    def _hough(blurred, min_r, max_r):
        """Hough menangani koin yang tepinya putus karena bayangan/pantulan."""
        circles = cv2.HoughCircles(
            blurred, cv2.HOUGH_GRADIENT, dp=1.2,
            minDist=max(10, min_r * 2), param1=120, param2=28,
            minRadius=min_r, maxRadius=max_r,
        )
        if circles is None:
            return None
        # HOUGH_GRADIENT mengurutkan hasil dari nilai akumulator tertinggi.
        return np.round(circles[0][0]).astype(int)

    @staticmethod
    def _circle_contour(cx, cy, r, points=48):
        t = np.linspace(0, 2 * np.pi, points, endpoint=False)
        pts = np.stack([cx + r * np.cos(t), cy + r * np.sin(t)], axis=1)
        return pts.astype(np.int32).reshape((-1, 1, 2))

    @staticmethod
    def _contour_scan(blurred, off_x, off_y, min_r, max_r):
        """Cadangan bila Hough tidak menemukan apa pun."""
        edges = cv2.Canny(blurred, 30, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        min_area = np.pi * min_r * min_r * 0.5
        max_area = np.pi * max_r * max_r * 1.5

        best, best_fill = None, 0.0
        for c in contours:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area:
                continue

            _, radius = cv2.minEnclosingCircle(c)
            if radius <= 0:
                continue

            # Seberapa penuh kontur mengisi lingkaran pembungkusnya. Lebih
            # tahan tepi patah daripada 4*pi*A/P^2, yang anjlok begitu Canny
            # menyisakan busur terbuka.
            fill = area / (np.pi * radius * radius)
            if fill < 0.85 or fill <= best_fill:
                continue

            best, best_fill = c, fill

        if best is None:
            return None
        # Kembalikan koordinat kontur ke posisi gambar asli
        return cv2.contourArea(best), best + [off_x, off_y]
