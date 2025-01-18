from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import pandas as pd
from typing import List
import base64
from io import BytesIO
from PIL import Image

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the stock data
df = pd.read_csv('stock.csv')

# Initialize face mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    min_detection_confidence=0.5
)

def detect_face_shape(image_data: bytes) -> str:
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to RGB
    rgb_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Process the image
    results = face_mesh.process(rgb_image)
    
    if not results.multi_face_landmarks:
        return "No face detected"
    
    landmarks = results.multi_face_landmarks[0]
    
    # Extract key measurements
    face_height = landmarks.landmark[152].y - landmarks.landmark[10].y
    face_width = landmarks.landmark[454].x - landmarks.landmark[234].x
    jaw_width = landmarks.landmark[172].x - landmarks.landmark[397].x
    
    # Determine face shape based on ratios
    ratio = face_height / face_width
    jaw_ratio = jaw_width / face_width
    
    if ratio > 1.15:
        return "oblong"
    elif ratio < 0.85:
        return "round"
    elif jaw_ratio < 0.78:
        return "heart"
    elif jaw_ratio > 0.85:
        return "square"
    else:
        return "oval"

@app.post("/detect-face")
async def detect_face(file: UploadFile = File(...)):
    contents = await file.read()
    face_shape = detect_face_shape(contents)
    return {"face_shape": face_shape}

@app.get("/matching-frames/{face_shape}")
async def get_matching_frames(face_shape: str):
    matching_frames = df[df['frame_shape'].str.lower() == face_shape.lower()]
    return matching_frames.to_dict(orient='records')

@app.get("/frames")
async def get_frames(
    shape: str = None,
    min_price: float = None,
    max_price: float = None
):
    filtered_df = df.copy()
    
    if shape:
        filtered_df = filtered_df[filtered_df['frame_shape'].str.lower() == shape.lower()]
    if min_price is not None:
        filtered_df = filtered_df[filtered_df['price'] >= min_price]
    if max_price is not None:
        filtered_df = filtered_df[filtered_df['price'] <= max_price]
        
    return filtered_df.to_dict(orient='records')
