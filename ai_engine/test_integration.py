import os
import cv2
import json
import sys
from pathlib import Path

# Impor model yang sudah diubah
from model import PantasModel

def test():
    print("Inisialisasi Model AI PANTAS (YOLO 1 + OpenCV + YOLO 2)...")
    pantas = PantasModel()
    
    # Ambil 1 gambar busuk dari dataset tomat untuk testing
    # Supaya kita bisa melihat VETO YOLO 2 beraksi
    test_img_path = r"d:\Belajar_Pemrograman\WebDev\PANTAS\ai_engine\image copy 4.png"
    # if not os.path.exists(test_img_path):
    #     print("Dataset tomat busuk tidak ditemukan untuk testing.")
    #     sys.exit(1)
        
    # img_files = os.listdir(test_img_path)
    # if not img_files:
    #     print("Folder kosong.")
    #     sys.exit(1)
        
    # # Ambil gambar pertama
    # sample_img_file = os.path.join(test_img_path, img_files[0])
    
    print(f"Membaca gambar: { test_img_path}")
    img_array = cv2.imread( test_img_path)
    if img_array is None:
        print("Gagal membaca gambar.")
        sys.exit(1)
        
    print("\nMenjalankan fungsi predict()...")
    # Anggap koin berada di koordinat dummy
    roi_koin = (10, 10, 100, 100) 
    
    dict_results, annotated_img = pantas.predict(img_array, "tomato_merah", roi=roi_koin)
    
    print("\n--- HASIL INTEGRASI MULTI-MODEL ---")
    print(json.dumps(dict_results, indent=2))
    
    # Simpan output visual
    out_path = "integration_test_output.jpg"
    cv2.imwrite(out_path, annotated_img)
    print(f"\nGambar hasil anotasi disimpan di: {out_path}")
    print("Test berhasil diselesaikan tanpa error.")

if __name__ == "__main__":
    test()
