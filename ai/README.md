<div align="center">
  <h1>🧠 FRESHLY Universal API & Machine Learning Module</h1>
  <p>
    <b>Arsitektur Model AI Kustom, Spatial Attention Layer, Pipeline Pelatihan, dan REST API Inferensi.</b>
  </p>

  <p align="center">
    <a href="https://freshlyteam-freshly-api.hf.space/docs" target="_blank">
      <img src="https://img.shields.io/badge/🚀_LIVE_SWAGGER_DOCS-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="Swagger Docs" />
    </a>
    <a href="https://www.kaggle.com/datasets/tirtasurya/freshly-dataset" target="_blank">
      <img src="https://img.shields.io/badge/📊_Dataset_Kaggle-Freshly-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white" alt="Dataset Kaggle" />
    </a>
    <img src="https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.10+" />
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=flat-square&logo=tensorflow&logoColor=white" alt="TensorFlow" />
    <img src="https://img.shields.io/badge/Keras-D00000?style=flat-square&logo=keras&logoColor=white" alt="Keras" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Hugging_Face-FFD21E?style=flat-square&logo=huggingface&logoColor=black" alt="Hugging Face" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Uvicorn-4990e2?style=flat-square&logo=python&logoColor=white" alt="Uvicorn" />
  </p>
</div>

---

## 📖 Deskripsi Singkat Proyek

Selamat datang di repositori resmi **FRESHLY Machine Learning & API**! 

Modul AI ini dirancang khusus untuk menjadi otak utama platform FRESHLY dalam mengklasifikasikan jenis buah/sayur beserta tingkat kematangannya (*Ripe*, *Unripe*, *Rotten*) secara instan. API inferensi dibangun menggunakan **FastAPI** yang ringan dan berkinerja tinggi, sedangkan model Deep Learning dilatih menggunakan arsitektur kustom *Convolutional Neural Network (CNN) dengan Spatial Attention Layer* dari nol (*Training from Scratch*).

---

## 🧠 Spesifikasi Arsitektur Model & Bukti Evaluasi

Berbeda dengan sistem klasifikasi pada umumnya yang mengandalkan transfer learning (model pre-trained), model AI FRESHLY dibangun 100% dari nol. Keunggulan utama model kami terletak pada integrasi **Spatial Attention Layer** kustom.

> [!NOTE]
> **Spatial Attention Layer** membantu model untuk fokus pada area krusial dari buah/sayur (seperti bercak hitam pembusukan atau perubahan warna kulit buah) dan mengabaikan informasi latar belakang gambar yang tidak relevan.

Sebagai bukti visual berfungsinya *Spatial Attention* kami, perhatikan visualisasi **Grad-CAM** pada contoh buah jeruk busuk berikut:

<p align="center">
  <img src="https://drive.google.com/uc?export=view&id=1m1lqghTR1MMhT64YzHpqt-92MLgot-9y" alt="Grad-CAM Orange Rotten" width="70%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
  <br>
  <i>Warna merah pekat menunjukkan konsentrasi perhatian model tertuju tepat pada area pembusukan buah jeruk dengan tingkat kepercayaan (confidence score) sebesar 99.99%.</i>
</p>

---

## 🗂️ Struktur Direktori Modul

```
ai/
├── 🚀 freshly_api/                # Kode sumber FastAPI Server & model untuk deployment
│   ├── Dockerfile                 # Konfigurasi containerization Docker
│   ├── main.py                    # Entry point aplikasi FastAPI
│   ├── requirements.txt           # Dependensi library API server
│   ├── banana_saved_model/        # Ekspor model Pisang siap pakai
│   ├── chili_saved_model/         # Ekspor model Cabai siap pakai
│   ├── mango_saved_model/         # Ekspor model Mangga siap pakai
│   ├── orange_saved_model/        # Ekspor model Jeruk siap pakai
│   ├── paprika_saved_model/       # Ekspor model Paprika siap pakai
│   └── tomato_saved_model/        # Ekspor model Tomat siap pakai
│
├── 📂 freshly_model/              # Notebook proses pelatihan dari awal (Training Notebooks)
│   ├── banana_model.ipynb
│   ├── chili_model.ipynb
│   ├── mango_model.ipynb
│   ├── orange_model.ipynb
│   ├── paprika_model.ipynb
│   └── tomato_model.ipynb
│
├── 📊 logs/                       # File log TensorBoard untuk monitoring metrik pelatihan
│   ├── banana/gradient_tape/...
│   ├── chili/gradient_tape/...
│   ├── mango/gradient_tape/...
│   ├── orange/gradient_tape/...
│   ├── paprika/gradient_tape/...
│   └── tomato/gradient_tape/...
│
├── 📦 model_h5/                   # Penyimpanan file model berformat Keras (.h5) versi dasar
│   ├── freshly_model_banana.h5
│   ├── freshly_model_chili.h5
│   ├── freshly_model_mango.h5
│   ├── freshly_model_orange.h5
│   ├── freshly_model_paprika.h5
│   └── freshly_model_tomato.h5
│
├── 📦 modeltun_h5/                # Penyimpanan model berformat Keras (.h5) hasil fine-tuning
│   ├── freshly_model_banana_tuning.h5
│   ├── freshly_model_chili_tuning.h5
│   ├── freshly_model_mango_tuning.h5
│   └── freshly_model_tomato_tuning.h5
│
├── 📦 saved_model/                # Backup direktori ekspor TensorFlow SavedModel global
│   ├── banana_saved_model/
│   ├── chili_saved_model/
│   ├── mango_saved_model/
│   ├── orange_saved_model/
│   ├── paprika_saved_model/
│   └── tomato_saved_model/
│
├── 📓 Inference.ipynb             # Notebook untuk pengujian inferensi & visualisasi Grad-CAM
└── 📄 README.md                   # Dokumentasi utama modul AI (file ini)
```

---

## 🚀 Dokumentasi API & Endpoint Reference

### Base URL Layanan
* **Hugging Face Spaces (Live Direct):** `https://freshlyteam-freshly-api.hf.space`
* **Swagger UI (Interactive):** `https://freshlyteam-freshly-api.hf.space/docs`

### 1. Health Check
Memastikan status server inferensi aktif dan berjalan normal.
* **URL:** `/health`
* **Method:** `GET`
* **Response Contoh (200 OK):**
  ```json
  {
    "status": "healthy",
    "message": "FRESHLY API Server is running normally"
  }
  ```

### 2. Predict Freshness (Main Inference API)
Mengirimkan gambar buah/sayur beserta jenisnya untuk diprediksi tingkat kesegarannya.
* **URL:** `/predict`
* **Method:** `POST`
* **Content-Type:** `multipart/form-data`
* **Request Body:**
  * `fruit_type` (String, required): Kelas buah yang diuji (lihat daftar di bawah).
  * `file` (File, required): File citra buah/sayur (format JPG, PNG, atau WebP).
* **Response Contoh (201 Created / 200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "detected_fruit": "banana",
      "condition": "ripe",
      "condition_confidence": 98.5
    }
  }
  ```

---

## 🍎 Daftar Parameter `fruit_type` yang Valid

Untuk memastikan keakuratan prediksi model, parameter **`fruit_type`** wajib ditulis menggunakan huruf kecil (*lowercase*) sesuai dengan ejaan berikut:

| Parameter | Komoditas | Kelas Klasifikasi Output |
| :--- | :--- | :--- |
| **`banana`** | Pisang | `banana_ripe`, `banana_unripe`, `banana_rotten` |
| **`chili`** | Cabai | `chili_ripe`, `chili_unripe`, `chili_rotten` |
| **`mango`** | Mangga | `mango_ripe`, `mango_unripe`, `mango_rotten` |
| **`orange`** | Jeruk | `orange_ripe`, `orange_unripe`, `orange_rotten` |
| **`paprika`** | Paprika | `paprika_ripe`, `paprika_unripe`, `paprika_rotten` |
| **`tomato`** | Tomat | `tomato_ripe`, `tomato_unripe`, `tomato_rotten` |

> [!WARNING]
> Server akan mengembalikan kode status **400 Bad Request** atau **422 Validation Error** jika input `fruit_type` tidak sesuai dengan salah satu nilai pada tabel di atas.

---

## 💻 Panduan Integrasi untuk Tim Frontend

Berikut adalah contoh skrip sederhana menggunakan **Fetch API** di JavaScript untuk memanggil endpoint AI:

```javascript
// 1. Ambil file gambar dari form input HTML
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];
const selectedFruit = "banana"; // drop-down pilihan user di aplikasi

// 2. Siapkan data form multipart
const formData = new FormData();
formData.append("fruit_type", selectedFruit);
formData.append("file", file);

// 3. Kirim permintaan POST ke API server
fetch("https://freshlyteam-freshly-api.hf.space/predict", {
    method: "POST",
    body: formData
})
.then(response => {
    if (!response.ok) throw new Error("Gagal mendapatkan prediksi");
    return response.json();
})
.then(result => {
    console.log("Detected:", result.data.detected_fruit);
    console.log("Condition:", result.data.condition);
    console.log("Confidence:", result.data.condition_confidence + "%");
})
.catch(error => {
    console.error("Error:", error);
});
```

---

## ⚙️ Petunjuk Setup Lokal & Replikasi Pelatihan

### 1. Persiapan Lingkungan Virtual
Instal **Git LFS** (Large File Storage) sebelum melakukan clone repositori agar berkas model berformat `.h5` terunduh secara penuh.

```bash
# 1. Clone repositori & pindah ke direktori API
git clone https://github.com/FRESHLY-CC26-PSU059/FRESHLY.git
cd FRESHLY/ai/freshly_api

# 2. Buat & aktifkan virtual environment
python -m venv ai-env
# Windows:
ai-env\Scripts\activate
# Mac/Linux:
source ai-env/bin/activate

# 3. Instal pustaka dependensi
pip install -r requirements.txt
```

### 2. Menjalankan Server Inferensi Lokal
Gunakan **Uvicorn** untuk menyalakan server pengembangan lokal:
```bash
uvicorn main:app --reload
```
Layanan API lokal akan berjalan pada alamat **`http://localhost:8000`**. Kunjungi **`http://localhost:8000/docs`** untuk mengakses dokumentasi interaktif Swagger lokal.

### 3. Membuka Eksperimen Model (Jupyter Notebook)
Jika ingin melihat proses pembangunan arsitektur CNN, pelatihan epoch, evaluasi metrik kurva loss/accuracy, atau modifikasi visualisasi perhatian model:
```bash
cd ../freshly_model
jupyter notebook
```

---
**Developed with 🔥💪 by Tim AI FRESHLY - Coding Camp powered by DBS Foundation 2026**
