from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import pandas as pd
import pickle
from typing import List, Optional
from face_shape_recommendations import FACE_SHAPE_RECOMMENDATIONS, FRAME_STYLE_CHARACTERISTICS

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Load the trained model and scaler
with open('face_shape_model.pkl', 'rb') as f:
    clf, scaler = pickle.load(f)

def extract_features(landmarks):
    """Extract meaningful features from facial landmarks"""
    features = []
    
    # Face height (forehead to chin)
    face_height = landmarks.landmark[152].y - landmarks.landmark[10].y
    
    # Face width (temple to temple)
    face_width = landmarks.landmark[454].x - landmarks.landmark[234].x
    
    # Jaw width
    jaw_width = landmarks.landmark[172].x - landmarks.landmark[397].x
    
    # Cheekbone width
    cheekbone_width = landmarks.landmark[123].x - landmarks.landmark[352].x
    
    # Forehead width
    forehead_width = landmarks.landmark[109].x - landmarks.landmark[338].x
    
    # Calculate ratios
    features.extend([
        face_height / face_width,  # Height to width ratio
        jaw_width / face_width,    # Jaw to face width ratio
        cheekbone_width / jaw_width,  # Cheekbone to jaw ratio
        forehead_width / jaw_width,   # Forehead to jaw ratio
    ])
    
    return features

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
    
    # Extract features
    features = extract_features(landmarks)
    
    # Scale features
    features_scaled = scaler.transform([features])
    
    # Predict face shape
    face_shape = clf.predict(features_scaled)[0]
    
    return face_shape

@app.post("/detect-face")
async def detect_face(file: UploadFile = File(...)):
    contents = await file.read()
    face_shape = detect_face_shape(contents)
    return {
        "face_shape": face_shape,
        "recommended_styles": FACE_SHAPE_RECOMMENDATIONS.get(face_shape, []),
        "style_info": {
            style: FRAME_STYLE_CHARACTERISTICS[style]
            for style in FACE_SHAPE_RECOMMENDATIONS.get(face_shape, [])
            if style in FRAME_STYLE_CHARACTERISTICS
        }
    }

@app.get("/matching-frames/{face_shape}")
async def get_matching_frames(
    face_shape: str,
    gender: Optional[str] = None,
    age_group: Optional[str] = None
):
    recommended_styles = FACE_SHAPE_RECOMMENDATIONS.get(face_shape, [])
    matching_frames = df[df['frame_shape'].isin(recommended_styles)]
    
    if gender:
        matching_frames = matching_frames[
            (matching_frames['gender'] == gender) | 
            (matching_frames['gender'] == 'unisex')
        ]
    
    if age_group:
        matching_frames = matching_frames[matching_frames['age_group'] == age_group]
        
    return matching_frames.to_dict(orient='records')

@app.get("/frames")
async def get_frames(
    shape: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    gender: Optional[str] = None,
    age_group: Optional[str] = None
):
    filtered_df = df.copy()
    
    if shape:
        if shape in FACE_SHAPE_RECOMMENDATIONS:
            # If a face shape is provided, get all recommended frame shapes
            recommended_styles = FACE_SHAPE_RECOMMENDATIONS[shape]
            filtered_df = filtered_df[filtered_df['frame_shape'].isin(recommended_styles)]
        else:
            # If a specific frame shape is provided
            filtered_df = filtered_df[filtered_df['frame_shape'] == shape]
            
    if min_price is not None:
        filtered_df = filtered_df[filtered_df['price'] >= min_price]
    if max_price is not None:
        filtered_df = filtered_df[filtered_df['price'] <= max_price]
    if brand:
        filtered_df = filtered_df[filtered_df['brand'].str.lower() == brand.lower()]
    if gender:
        filtered_df = filtered_df[
            (filtered_df['gender'] == gender) | 
            (filtered_df['gender'] == 'unisex')
        ]
    if age_group:
        filtered_df = filtered_df[filtered_df['age_group'] == age_group]
        
    return filtered_df.to_dict(orient='records')

@app.get("/filters")
async def get_filters():
    """Get all available filter options"""
    return {
        "brands": df['brand'].unique().tolist(),
        "frame_shapes": df['frame_shape'].unique().tolist(),
        "genders": df['gender'].unique().tolist(),
        "age_groups": df['age_group'].unique().tolist(),
        "price_range": {
            "min": float(df['price'].min()),
            "max": float(df['price'].max())
        }
    }
