import os
import requests
from duckduckgo_search import DDGS
from io import BytesIO
from PIL import Image
import uuid

def download_images(query, max_results=30, output_dir=""):
    print(f"Mencari gambar untuk query: '{query}'")
    results = DDGS().images(
        keywords=query,
        region="wt-wt",
        safesearch="off",
        size="Medium",
        color="color",
        type_image="photo",
        layout="Square",
        license_image="any",
        max_results=max_results,
    )
    
    count = 0
    for r in results:
        url = r.get('image')
        if not url:
            continue
        try:
            print(f"Mengunduh {url[:50]}...")
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                img = Image.open(BytesIO(response.content))
                img = img.convert('RGB')
                
                # Split 80% train, 20% val
                if count % 5 == 0:
                    split = "val"
                else:
                    split = "train"
                    
                path = os.path.join(output_dir, split, "sehat")
                os.makedirs(path, exist_ok=True)
                
                filename = f"scraped_{uuid.uuid4().hex[:8]}.jpg"
                img.save(os.path.join(path, filename))
                count += 1
                
        except Exception as e:
            pass
            
    print(f"Selesai! Berhasil mengunduh {count} gambar untuk query '{query}'")

def main():
    base_dir = r"d:\Belajar_Pemrograman\WebDev\PANTAS\ai_engine\datasets\yolo2_classification\tomato"
    
    queries = [
        "healthy tomato bottom view",
        "tomato stem scar healthy",
        "perfect red tomato bottom",
    ]
    
    for q in queries:
        download_images(q, max_results=40, output_dir=base_dir)

if __name__ == "__main__":
    main()
