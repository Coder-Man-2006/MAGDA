# MAGDA

# Backend Setup

## Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Unix/MacOS

## Install Python dependencies
cd backend
pip install -r requirements.txt

## Start the FastAPI server
python -m uvicorn main:app --reload

# Frontend Setup

## Install Node.js dependencies
cd eyewear-frontend
npm install

## Start the development server
npm run dev

# ML Model 

Collect the dataset from https://www.kaggle.com/datasets/niten19/face-shape-dataset

Import the dataset into the backend/FaceShapeDataset folder (import testing_set and training_set directly)

