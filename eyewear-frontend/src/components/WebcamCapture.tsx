import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { Box, Button, Paper } from '@mui/material'
import { PhotoCamera } from '@mui/icons-material'
import axios from 'axios'

interface WebcamCaptureProps {
  setFaceShape: (shape: string) => void
  setFrames: (frames: any[]) => void
  setIsLoading: (loading: boolean) => void
}

const WebcamCapture = ({ setFaceShape, setFrames, setIsLoading }: WebcamCaptureProps) => {
  const webcamRef = useRef<Webcam>(null)
  const [hasPhoto, setHasPhoto] = useState(false)

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return

    setIsLoading(true)
    setHasPhoto(true)

    try {
      // Convert base64 to blob
      const base64Data = imageSrc.split(',')[1]
      const blob = await fetch(imageSrc).then(res => res.blob())
      
      // Create form data
      const formData = new FormData()
      formData.append('file', blob, 'webcam.jpg')

      // Send to backend
      const response = await axios.post('http://localhost:8000/detect-face', formData)
      const { face_shape } = response.data

      setFaceShape(face_shape)

      // Get matching frames
      const framesResponse = await axios.get(`http://localhost:8000/matching-frames/${face_shape}`)
      setFrames(framesResponse.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [setFaceShape, setFrames, setIsLoading])

  return (
    <Box sx={{ my: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: 640,
          mx: 'auto'
        }}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
          style={{ width: '100%', height: 'auto' }}
        />
        <Button
          variant="contained"
          startIcon={<PhotoCamera />}
          onClick={capture}
          sx={{ mt: 2 }}
          disabled={hasPhoto}
        >
          Take Photo
        </Button>
      </Paper>
    </Box>
  )
}

export default WebcamCapture 