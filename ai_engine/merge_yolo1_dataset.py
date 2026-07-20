import os
import shutil
from pathlib import Path

def process_dataset(src_dir, dest_dir):
    """
    Menyalin gambar dan me-remap label dari src_dir ke dest_dir.
    src_dir: Path object ke folder dataset aslinya (berisi train, valid, test)
    dest_dir: Path object ke folder tujuan (yolo1_segmentation/chili)
    """
    for split in ['train', 'valid', 'test']:
        src_img_dir = src_dir / split / "images"
        src_lbl_dir = src_dir / split / "labels"
        
        dest_img_dir = dest_dir / split / "images"
        dest_lbl_dir = dest_dir / split / "labels"
        
        # Buat folder jika belum ada
        dest_img_dir.mkdir(parents=True, exist_ok=True)
        dest_lbl_dir.mkdir(parents=True, exist_ok=True)
        
        if not src_img_dir.exists():
            continue
            
        print(f"Memproses folder: {src_dir.name} -> {split}...")
        
        img_files = list(src_img_dir.glob("*.*"))
        for img_file in img_files:
            # Salin gambar
            dest_img_path = dest_img_dir / img_file.name
            if not dest_img_path.exists():
                shutil.copy(str(img_file), str(dest_img_path))
            
            # Cari file label yang sesuai (YOLO format txt)
            lbl_file = src_lbl_dir / (img_file.stem + ".txt")
            dest_lbl_path = dest_lbl_dir / lbl_file.name
            
            if lbl_file.exists():
                with open(lbl_file, 'r') as f:
                    lines = f.readlines()
                
                # Remap semua kelas menjadi 0
                new_lines = []
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) > 1:
                        parts[0] = "0" # Ubah Class ID menjadi 0
                        new_lines.append(" ".join(parts) + "\n")
                
                with open(dest_lbl_path, 'w') as f:
                    f.writelines(new_lines)

def create_data_yaml(dest_dir):
    yaml_content = """train: train/images
val: valid/images
test: test/images

nc: 1
names: ['chili']
"""
    yaml_path = dest_dir / "data.yaml"
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    print(f"Berhasil membuat: {yaml_path}")

def main():
    base_dir = Path(r"d:\Belajar_Pemrograman\WebDev\PANTAS\ai_engine")
    scratch_dir = Path(r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\eb8352d5-c531-4389-8966-bed38847409f\scratch")
    
    old_ds = scratch_dir / "old_yolo1"
    new_ds = scratch_dir / "new_yolo1"
    dest_ds = base_dir / "datasets" / "yolo1_segmentation" / "chili"
    
    print("Memulai proses penggabungan dataset YOLO 1 Cabai...")
    
    if new_ds.exists():
        process_dataset(new_ds, dest_ds)
    else:
        print("Folder new_yolo1 tidak ditemukan.")
        
    create_data_yaml(dest_ds)
    print("Selesai!")

if __name__ == "__main__":
    main()
