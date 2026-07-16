import os
import subprocess
import sys

commodities = ['chili', 'tomato', 'carrot', 'cucumber']

print("========================================")
print("SISTEM TRAINING OTOMATIS (ALL COMMODITIES)")
print("========================================")

for comm in commodities:
    print(f"\n[{comm.upper()}] Memulai proses training...")
    
    # Menjalankan train_model.py untuk komoditas tertentu
    # stdout dan stderr tidak di-capture agar progress bar YOLO tetap terlihat di terminal
    try:
        subprocess.run([sys.executable, "train_yolo1_seg.py", comm], check=True)
        print(f"[{comm.upper()}] Training SELESAI dan berhasil disimpan!")
    except subprocess.CalledProcessError:
        print(f"\n[ERROR] Training {comm.upper()} gagal atau dibatalkan.")
        print("Menghentikan antrean training berikutnya.")
        sys.exit(1)

print("\n========================================")
print("SEMUA TRAINING SPESIALIS TELAH SELESAI!")
print("========================================")
