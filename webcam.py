import cv2 
import sys
import os
from ultralytics import YOLO 

print("========================================")
print("SISTEM PENYORTIR PANTAS (SINGLE-CLASS)")
print("========================================")
print("Pilih komoditas yang akan disortir:")
print("1. Cabai (Chili)")
print("2. Tomat (Tomato)")
print("3. Wortel (Carrot)")
print("4. Timun (Cucumber)")

choice = input("Masukkan angka pilihan Anda (1-4): ")

commodities = {'1': 'chili', '2': 'tomato', '3': 'carrot', '4': 'cucumber'}
if choice not in commodities:
    print("Pilihan tidak valid.")
    sys.exit(1)

target_comm = commodities[choice]
model_path = rf"d:\Belajar_Pemrograman\Machine_Learning\Machine_Learning_Projects\DeepLearning\YOLO\PANTAS\runs\segment\model_spesialis_{target_comm}\weights\best.pt"

if not os.path.exists(model_path):
    print(f"\n[ERROR] Model Spesialis untuk {target_comm.upper()} belum dilatih atau belum selesai!")
    print(f"Path yang dicari: {model_path}")
    print("Silakan jalankan: python train_model.py " + target_comm)
    sys.exit(1)

print(f"\nMemuat AI Spesialis: {target_comm.upper()}...")
model = YOLO(model_path)

# Load and resize image first to prevent CUDA OOM on massive 9 Megapixel images
img_path = "chili_test.png"
img = cv2.imread(img_path)
# Resize to a max width of 1024 to save GPU memory during mask drawing
height, width = img.shape[:2]
if width > 1024:
    scale = 1024 / width
    img = cv2.resize(img, (1024, int(height * scale)))

# Run inference on the resized image
model(source=img, save=True, project="results_test", name="predict", exist_ok=True)