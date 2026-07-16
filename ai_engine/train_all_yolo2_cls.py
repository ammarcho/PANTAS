import subprocess
import sys

commodities = ["tomato", "chili", "cucumber", "carrot"]

def main():
    print("Memulai proses training batch untuk YOLO 2 (Klasifikasi)...")
    for commodity in commodities:
        print(f"\n{'='*50}")
        print(f"TRAINING YOLO 2 KOMODITAS: {commodity.upper()}")
        print(f"{'='*50}")
        
        # Panggil script train_yolo2_cls.py
        result = subprocess.run([sys.executable, "train_yolo2_cls.py", commodity])
        
        if result.returncode != 0:
            print(f"Error saat training YOLO 2 untuk {commodity}. Melanjutkan ke komoditas berikutnya...")
        else:
            print(f"Training YOLO 2 untuk {commodity} selesai dengan sukses.")

if __name__ == "__main__":
    main()
