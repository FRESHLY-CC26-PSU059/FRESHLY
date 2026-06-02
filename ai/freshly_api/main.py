import io
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from PIL import Image

app = FastAPI(
    title="Freshly API",
    description="API deteksi kematangan buah dan sayur.",
    version="1.0.2"
)

# 1. Konfigurasi Model
CONFIG = {
    "banana":  ['banana_ripe', 'banana_rotten', 'banana_unripe'],
    "mango":   ['mango_ripe', 'mango_rotten', 'mango_unripe'],
    "orange":  ['orange_ripe', 'orange_rotten', 'orange_unripe'],
    "chili":   ['chili_ripe', 'chili_rotten', 'chili_unripe'],
    "paprika": ['paprika_ripe', 'paprika_rotten', 'paprika_unripe'],
    "tomato":  ['tomato_ripe', 'tomato_rotten', 'tomato_unripe']
}

IMG_SIZE = (224, 224)
MEAN = np.array([0.485, 0.456, 0.406])
STD = np.array([0.229, 0.224, 0.225])

# 2. Memuat Semua Model ke Memori
models = {}
print("Memulai proses pemuatan semua model...")
for fruit_type in CONFIG.keys():
    model_folder = f"{fruit_type}_saved_model"
    try:
        models[fruit_type] = tf.keras.models.load_model(model_folder)
        print(f" -> Model {fruit_type.upper()} berhasil dimuat.")
    except Exception as e:
        print(f" [X] Gagal memuat model {fruit_type}: {e}")

# 3. Fungsi Preprocessing
def preprocess_image(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize(IMG_SIZE)
        img_array = tf.keras.utils.img_to_array(img)
        img_array = img_array / 255.0
        img_array = (img_array - MEAN) / STD
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise ValueError(f"Gagal memproses gambar: {str(e)}")

# ENDPOINT HEALTH CHECK (Untuk UptimeRobot)
@app.get("/health")
def health_check():
    return {"status": "active", "message": "Server is awake and ready!"}

# ENDPOINT PREDIKSI (Satu URL untuk semua model)
@app.post("/predict")
async def predict_fruit(
    # Menerima teks (jenis buah) dan file (gambar) dalam satu Form yang sama
    fruit_type: str = Form(..., description="Tulis: banana, mango, orange, chili, paprika, atau tomato"),
    file: UploadFile = File(...)
):
    fruit_type = fruit_type.lower()
    
    # Validasi jenis buah
    if fruit_type not in models:
        raise HTTPException(
            status_code=404, 
            detail=f"Model '{fruit_type}' tidak ada. Pilihan: {list(models.keys())}"
        )
    
    # Validasi file
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File harus berupa gambar.")
    
    try:
        contents = await file.read()
        img_tensor = preprocess_image(contents)
        
        # Prediksi
        active_model = models[fruit_type]
        class_names = CONFIG[fruit_type]
        
        predictions = active_model.predict(img_tensor)
        pred_index = np.argmax(predictions[0])
        confidence = float(predictions[0][pred_index])
        
        return {
            "fruit_type": fruit_type,
            "filename": file.filename,
            "predicted_class": class_names[pred_index],
            "confidence": round(confidence * 100, 2),
            "all_probabilities": {
                class_names[i]: round(float(predictions[0][i]) * 100, 2) for i in range(len(class_names))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))