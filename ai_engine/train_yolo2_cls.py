import sys
import os
from ultralytics import YOLO 

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python train_yolo2_cls.py <commodity_name>")
        print("Example: python train_yolo2_cls.py tomato")
        sys.exit(1)
        
    from pathlib import Path
    commodity = sys.argv[1].lower()
    
    script_dir = Path(__file__).parent
    # Path dataset untuk YOLO 2 adalah path direktori (tanpa data.yaml)
    data_dir = script_dir / "datasets" / "yolo2_classification" / commodity
    data_dir = str(data_dir.resolve())

    if not os.path.exists(data_dir):
        print(f"Error: Direktori {data_dir} tidak ditemukan. Dataset klasifikasi belum siap.")
        sys.exit(1)
        
    print(f"Memulai training YOLO 2 (Klasifikasi Kesehatan) untuk {commodity.upper()}...")
    
    # Menggunakan model YOLOv11 khusus Klasifikasi (-cls)
    model = YOLO("yolo11n-cls.pt")
    
    model.train(
        data=data_dir, 
        epochs=50, 
        batch=16,
        imgsz=224, # Ukuran standar untuk klasifikasi (lebih ringan dan cepat)
        name=f"model_yolo2_{commodity}", 
        device=0 # Gunakan 0 jika ada GPU, atau ubah ke 'cpu' jika error
    )
