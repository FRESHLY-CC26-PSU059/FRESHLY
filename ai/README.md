<div align="center">
  <h1>🧠 FRESHLY Universal API & Machine Learning Module</h1>
  <p>
    <b>Dokumentasi Arsitektur AI, Custom CNN, Spatial Attention, dan REST API Backend</b>
  </p>
</div>

---

## 📖 Deskripsi Singkat Proyek

Selamat datang di repositori modul AI resmi **FRESHLY API**! 

API ini dibangun menggunakan **FastAPI** dan ditenagai oleh model Deep Learning kustom (arsitektur *CNN dengan Spatial Attention*) yang dilatih dari nol (*Training from Scratch*). Modul ini berfungsi sebagai otak utama aplikasi FRESHLY untuk mengklasifikasikan jenis buah/sayur beserta tingkat kematangannya guna mengurangi *food waste*.

### 🧠 Spesifikasi Arsitektur Model & Bukti Evaluasi
Berbeda dengan API pada umumnya yang menggunakan *Pre-trained Model* (Transfer Learning), model AI FRESHLY dibangun 100% dari awal. Keunggulan utama model kami terletak pada penggunaan **Spatial Attention Layer** buatan sendiri. 

Fitur ini memungkinkan "mata" AI kami untuk berfokus pada titik-titik krusial pada gambar (seperti bercak hitam pembusukan atau transisi warna mentah ke matang), mengabaikan *background* yang tidak penting, dan menghasilkan akurasi prediksi yang sangat tinggi. 

Sebagai bukti berfungsinya *Spatial Attention* kami, perhatikan hasil visualisasi **Grad-CAM** pada komoditas jeruk di bawah ini:

<p align="center">
  <img src="../fullstack/frontend/src/assets/images/gradcam_orange.jpg" alt="Grad-CAM Orange Rotten" width="70%" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
  <br>
  <i>Fokus model (warna merah pekat) tepat berada di area pembusukan jeruk dengan tingkat kepercayaan (confidence) 99.99%, membuktikan bahwa model tidak terdistraksi oleh latar belakang.</i>
</p>

## 🛠️ Tech Stack & Teknologi
* **Framework Backend:** FastAPI, Uvicorn
* **Machine Learning:** TensorFlow, Keras
* **Arsitektur Utama:** Custom CNN Cascade System
* **Deployment:** Docker, Hugging Face Spaces

---

## 🔗 Tautan Model ML (Jika Ada)

Bagi tim Frontend atau penguji yang ingin langsung mencoba mengunggah gambar ke AI tanpa perlu menulis kode, silakan akses halaman Swagger UI kami di bawah ini:

👉 **[Buka Halaman Uji Coba API Interaktif (/docs)](https://freshlyteam-freshly-api.hf.space/docs)**

* **Base URL API (Hugging Face Spaces):** [https://freshlyteam-freshly-api.hf.space](https://freshlyteam-freshly-api.hf.space)
* **Tautan Dataset Utama (Kaggle):** [https://www.kaggle.com/datasets/tirtasurya/freshly-dataset](https://www.kaggle.com/datasets/tirtasurya/freshly-dataset)

---

## 🚀 Daftar Endpoint

### 1. Health Check
Endpoint ini digunakan untuk memastikan server dalam keadaan aktif (cocok dihubungkan dengan *UptimeRobot* untuk mencegah *cold start*).
* **URL:** `/health`
* **Method:** `GET`
* **Response:** JSON berisi status server.

### 2. Predict Freshness (Main AI)
Endpoint utama untuk mendeteksi tingkat kematangan buah/sayur. Untuk menjaga akurasi tertinggi, API ini membutuhkan jenis buah yang dipilih oleh pengguna sebagai parameter.
* **URL:** `/predict`
* **Method:** `POST`
* **Body:** `multipart/form-data` 
  * `fruit_type` (String): Tulis salah satu dari kelas yang didukung (contoh: banana, mango, chili).
  * `file` (File): File gambar buah/sayur.
* **Response Contoh:**
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

## 🍎 Parameter `fruit_type` yang Valid

Sangat penting bagi tim Frontend atau Penguji untuk mengirimkan **`fruit_type`** dengan ejaan huruf kecil yang tepat. **Saat ini, model kami mendukung 6 kelas berikut:**

* **`banana` (Pisang)**
* **`mango` (Mangga)**
* **`orange` (Jeruk)**
* **`chili` (Cabai)**
* **`paprika` (Paprika)**
* **`tomato` (Tomat)**

*Sistem akan mengembalikan error 400 (Bad Request) atau 422 (Validation Error) jika memasukkan jenis buah selain daftar di atas.*

---

## 💻 Panduan Integrasi (Untuk Tim Frontend)

Berikut adalah contoh implementasi pemanggilan API `/predict` menggunakan **JavaScript (Fetch API)** di sisi *client*:

```javascript
// 1. Ambil elemen dari HTML
const fileInput = document.getElementById('imageInput');
const file = fileInput.files[0];
const selectedFruit = "banana"; // Sesuai pilihan user di UI (dropdown/icon)

// 2. Siapkan form data
const formData = new FormData();
formData.append("fruit_type", selectedFruit); // Wajib dikirimkan!
formData.append("file", file);

// 3. Panggil API Freshly
fetch("[https://freshlyteam-freshly-api.hf.space/predict](https://freshlyteam-freshly-api.hf.space/predict)", {
    method: "POST",
    body: formData
})
.then(response => response.json())
.then(result => {
    console.log("Status:", result.status);
    console.log("Kondisi Buah:", result.data.condition);
})
.catch(error => {
    console.error("Terjadi kesalahan:", error);
});
```
*(Catatan: Ganti URL freshlyteam-freshly-api.hf.space dengan URL Direct Space kalian jika ada perubahan).*

---

## ⚙️ Petunjuk Setup Environment & Cara Menjalankan Aplikasi

Untuk mereplikasi proses pelatihan model (*training*) atau menjalankan server inferensi (*API*) secara lokal, ikuti langkah-langkah berikut:

### 1. Persiapan Environment
Pastikan Anda sudah menginstal **Python 3.10+** dan **Git LFS** (untuk menarik *file* model `.h5` atau `SavedModel` yang berukuran besar).

```bash
# 1. Clone repository
git clone [https://github.com/FRESHLY-CC26-PSU059/FRESHLY.git](https://github.com/FRESHLY-CC26-PSU059/FRESHLY.git)
cd FRESHLY/ai/freshly_api

# 2. Buat Virtual Environment (Opsional tapi disarankan)
python -m venv venv
source venv/bin/activate  # Untuk Windows: venv\Scripts\activate

# 3. Install library yang dibutuhkan
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Cara Menjalankan Server API Lokal (Local Development)
Jika tim Frontend ingin menguji API ini secara offline di komputer masing-masing:
```bash
# Pastikan berada di dalam direktori ai/freshly_api
uvicorn main:app --reload
```
*Server akan berjalan di `http://127.0.0.1:8000`. Akses `http://127.0.0.1:8000/docs` untuk Swagger UI lokal.*

### 3. Cara Menjalankan Eksperimen / Pelatihan Model (Jupyter Notebook)
Jika Anda ingin melihat proses pembuatan arsitektur CNN, augmentasi dataset, atau memunculkan visualisasi Grad-CAM secara mandiri:
```bash
# Pindah ke direktori model training
cd ../freshly_model

# Jalankan Jupyter Notebook
jupyter notebook
```
Buka salah satu *file* `.ipynb` melalui antarmuka *browser* Anda dan jalankan *cell* secara berurutan. Pastikan jalur (*path*) dataset di dalam *notebook* sudah disesuaikan dengan direktori lokal Anda.

<br>

**Developed with 🔥💪 by Tim AI FRESHLY - Coding Camp powered by DBS Foundation 2026**