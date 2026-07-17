from ultralytics import YOLO 


path = "image.png"
["tomato", "chili", "cucumber", "carrot"]
print("1. Tomato")
print("2. Chili")
print("3. Cucumber")
print("4. Carrot")
print("Pilih komoditas:")

pilihan = int(input(">>> "))
komoditas = ""
if pilihan == 1 :
    komoditas = 'tomato'
elif pilihan == 2 :
    komoditas = 'chili'
elif pilihan == 3 :
    komoditas = 'cucumber'
elif pilihan == 4 :
    komoditas = 'carrot'

model = YOLO(f'export_models/{komoditas}_cls.pt')

model.predict(source=path,save=True,exist_ok=True,save_dir='outputs')

