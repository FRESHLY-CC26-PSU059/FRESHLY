# Menggunakan image Python 3.9
FROM python:3.9

# Mengatur direktori kerja
WORKDIR /code

# Menyalin requirements dan menginstalnya
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Hugging Face Spaces menyarankan untuk membuat user non-root
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Pindah ke direktori home user
WORKDIR $HOME/app
COPY --chown=user . $HOME/app

# Hugging Face Spaces MEWAJIBKAN aplikasi berjalan di port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]