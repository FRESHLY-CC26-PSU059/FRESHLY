# FRESHLY Dataset Documentation

## Overview

This directory contains documentation and references to the datasets used in the FRESHLY project for fruit and vegetable ripeness classification.

The project focuses on classifying fruits and vegetables into three ripeness conditions:

* Ripe
* Unripe
* Rotten

The datasets were collected, cleaned, analyzed, and prepared by the Data Science team before being utilized by the Machine Learning team for model development.

---

## Dataset Sources

### 1. Raw Dataset (Google Drive)

Original dataset collected from various public sources before preprocessing and cleaning.

**Link:**
https://drive.google.com/drive/folders/1OKRIno5x2jUVYfLaSTwYssvhDqt5naaG?usp=sharing

> Access may require permission from the project team.

---

### 2. Raw Dataset (Kaggle Mirror)

Kaggle version of the original raw dataset uploaded for easier access and backup.

**Link:**
https://www.kaggle.com/datasets/araazh/capstone-raw-dataset

---

### 3. Clean Dataset

Dataset after data cleaning, duplicate removal, image quality assessment, and metadata verification.

**Link:**
https://www.kaggle.com/datasets/araazh/capstone-clean-dataset

#### Processing Applied

* Duplicate image removal
* Image quality assessment
* Data cleaning and validation
* Metadata generation

#### Notes

This version has **not** undergone train-validation-test splitting and does **not** contain augmented images.

---

### 4. Clean Dataset V2 (Final Dataset)

Final dataset prepared for machine learning experimentation.

**Link:**
https://www.kaggle.com/datasets/araazh/capstone-clean-dataset-v2

#### Additional Processing

Compared to the previous clean dataset version, this dataset includes:

* Stratified Train-Validation-Test Split
* Data Augmentation on the Training Set
* Class balancing for underrepresented classes
* Final preparation for Deep Learning model training

#### Dataset Usage

This dataset was used by the Machine Learning team for model development and evaluation.

---

## Dataset Structure

The dataset consists of fruit and vegetable images categorized into:

### Fruits

* Apple
* Banana
* Mango

### Vegetables

* Paprika
* Tomato
* Orange

Each category contains images labeled as:

* Ripe
* Unripe
* Rotten

---

## Data Science Pipeline

The Data Science workflow includes:

1. Data Collection
2. Data Assessment
3. Data Cleaning
4. Exploratory Data Analysis (EDA)
5. Feature Engineering
6. Dataset Splitting
7. Data Augmentation
8. Metadata Generation
9. Dashboard Development

The complete workflow can be found in:

```text
data-science/notebooks/01_freshly_data_pipeline.ipynb
```

---

## Additional Documentation

For detailed variable descriptions and metadata information, refer to:

* `data_dictionary.xlsx`
* `metadata.csv`
* `label_mapping.csv`

---

## Project

FRESHLY — Smart Fruit and Vegetable Quality Classification System

Capstone Project 2025–2026
