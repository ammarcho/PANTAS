import sys
import os
from ultralytics import YOLO 

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python train_yolo1_seg.py <commodity_name>")
        print("Example: python train_yolo1_seg.py chili")
        sys.exit(1)
        
    from pathlib import Path
    commodity = sys.argv[1].lower()
    
    script_dir = Path(__file__).parent
    data_yaml = script_dir / "datasets" / "yolo1_segmentation" / f"dataset-{commodity}" / "data.yaml"
    data_yaml = str(data_yaml.resolve())

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
