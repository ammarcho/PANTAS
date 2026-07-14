import sys
import os
from ultralytics import YOLO 

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python train_model.py <commodity_name>")
        print("Example: python train_model.py chili")
        sys.exit(1)
        
    commodity = sys.argv[1].lower()
    data_yaml = f"d:/Belajar_Pemrograman/Machine_Learning/Machine_Learning_Projects/DeepLearning/YOLO/PANTAS/dataset-{commodity}/data.yaml"
    
    if not os.path.exists(data_yaml):
        print(f"Error: {data_yaml} not found. Please build the dataset first.")
        sys.exit(1)
        
    print(f"Starting training for {commodity.upper()}...")
    model = YOLO("yolo11n-seg.pt")
    model.train(
        data=data_yaml, 
        epochs=100, 
        batch=8, 
        imgsz=416, 
        name=f"model_spesialis_{commodity}", 
        device=0
    )
