import os
import cv2
from pathlib import Path

def convert_yolo1_to_yolo2(src_dir, dest_dir_base):
    print(f"Mengonversi dataset dari {src_dir} menjadi format YOLO2 di {dest_dir_base}...")
    
    classes_map = {0: "busuk", 1: "sehat"}  # Sesuai dengan data.yaml: 0: Bad, 1: Good
    
    # Counter untuk nama unik
    counts = {"busuk": 0, "sehat": 0}
    
    for split in ['train', 'valid', 'test']:
        # YOLO2 (Ultralytics cls) standarnya train dan val. test jarang dipakai, tapi kita masukkan ke val/train saja.
        # Kita masukkan train -> train, valid -> val, test -> val
        out_split = "train" if split == "train" else "val"
        
        src_img_dir = src_dir / split / "images"
        src_lbl_dir = src_dir / split / "labels"
        
        if not src_img_dir.exists():
            continue
            
        print(f"  Memproses folder {split} (disimpan ke {out_split})...")
        
        # Buat folder output
        for cls_name in classes_map.values():
            (dest_dir_base / out_split / cls_name).mkdir(parents=True, exist_ok=True)
            
        for img_file in src_img_dir.glob("*.jpg"):
            lbl_file = src_lbl_dir / (img_file.stem + ".txt")
            if not lbl_file.exists():
                continue
                
            img = cv2.imread(str(img_file))
            if img is None:
                continue
                
            img_h, img_w = img.shape[:2]
            
            with open(lbl_file, 'r') as f:
                lines = f.readlines()
                
            for i, line in enumerate(lines):
                parts = line.strip().split()
                if len(parts) >= 5:
                    cls_id = int(parts[0])
                    if cls_id not in classes_map:
                        continue
                        
                    cls_name = classes_map[cls_id]
                    
                    if len(parts) == 5:
                        # Bounding Box format: cls, x_c, y_c, w, h
                        x_c, y_c, w_n, h_n = map(float, parts[1:5])
                        x_c_px, y_c_px = x_c * img_w, y_c * img_h
                        w_px, h_px = w_n * img_w, h_n * img_h
                        x1 = max(0, int(x_c_px - w_px / 2))
                        y1 = max(0, int(y_c_px - h_px / 2))
                        x2 = min(img_w, int(x_c_px + w_px / 2))
                        y2 = min(img_h, int(y_c_px + h_px / 2))
                    else:
                        # Polygon format: cls, x1, y1, x2, y2, ...
                        coords = list(map(float, parts[1:]))
                        xs = [x * img_w for x in coords[0::2]]
                        ys = [y * img_h for y in coords[1::2]]
                        x1 = max(0, int(min(xs)))
                        y1 = max(0, int(min(ys)))
                        x2 = min(img_w, int(max(xs)))
                        y2 = min(img_h, int(max(ys)))
                    
                    if x2 > x1 and y2 > y1:
                        crop_img = img[y1:y2, x1:x2]
                        # Simpan crop
                        out_path = dest_dir_base / out_split / cls_name / f"{img_file.stem}_crop{i}.jpg"
                        cv2.imwrite(str(out_path), crop_img)
                        counts[cls_name] += 1

    print(f"Konversi selesai! Total gambar dihasilkan: Sehat ({counts['sehat']}), Busuk ({counts['busuk']})")

def main():
    scratch_dir = Path(r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\eb8352d5-c531-4389-8966-bed38847409f\scratch")
    base_dir = Path(r"d:\Belajar_Pemrograman\WebDev\PANTAS\ai_engine")
    
    src_dir = scratch_dir / "test_yolo2"  # Folder hasil ekstrak Chili Project.v4i.yolov11.zip
    dest_dir = base_dir / "datasets" / "yolo2_classification" / "chili"
    
    # Hapus folder lama cabai jika ada, agar tidak tercampur
    import shutil
    if dest_dir.exists():
        print(f"Menghapus folder {dest_dir} lama...")
        shutil.rmtree(dest_dir)
        
    convert_yolo1_to_yolo2(src_dir, dest_dir)

if __name__ == "__main__":
    main()
