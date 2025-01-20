import { useCallback, useRef, useState, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Box, Button, Paper, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material'
import { PhotoCamera } from '@mui/icons-material'
import axios from 'axios'
import FaceMeshOverlay from './FaceMeshOverlay'

interface WebcamCaptureProps {
  setFaceShape: (shape: string) => void
  setFrames: (frames: any[]) => void
  setIsLoading: (loading: boolean) => void
}

interface VideoDevice {
  deviceId: string
  label: string
}

const WebcamCapture = ({ setFaceShape, setFrames, setIsLoading }: WebcamCaptureProps) => {
  const webcamRef = useRef<Webcam>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  useEffect(() => {
    // Get available video devices
    const getVideoDevices = async () => {
      try {
        // Request camera with specific constraints for better compatibility
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }
        })
        
        // Release the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop())
        
        // Then enumerate all devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}`
          }))
        
        console.log('Available cameras:', videoDevices)
        setVideoDevices(videoDevices)
        
        // Select the first device by default
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId)
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        if (error instanceof Error) {
          // Check if it's a permission error
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            console.error('Camera permission denied')
          }
          // Check if it's a security error (non-HTTPS)
          else if (error.name === 'SecurityError') {
            console.error('Camera access requires HTTPS')
          }
        }
      }
    }

    getVideoDevices()
  }, [selectedDevice])

  useEffect(() => {
    // Get the video element after the webcam is mounted
    if (webcamRef.current) {
      const video = webcamRef.current.video
      if (video) {
        setVideoElement(video)
      }
    }
  }, [webcamRef.current])

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

  const handleDeviceChange = (event: any) => {
    setSelectedDevice(event.target.value)
    setHasPhoto(false) // Reset photo state when changing device
  }

  const videoConstraints = {
    width: 640,
    height: 480,
    deviceId: selectedDevice,
    facingMode: "user"
  }

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
        {videoDevices.length > 0 ? (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Camera</InputLabel>
            <Select
              value={selectedDevice}
              label="Select Camera"
              onChange={handleDeviceChange}
            >
              {videoDevices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography color="error" sx={{ mb: 2 }}>
            No cameras detected. Please ensure you have a camera connected and have granted permission.
          </Typography>
        )}

        {selectedDevice && (
          <Box sx={{ position: 'relative' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', height: 'auto' }}
            />
            {videoElement && (
              <FaceMeshOverlay
                videoElement={videoElement}
                width={videoConstraints.width}
                height={videoConstraints.height}
              />
            )}
          </Box>
        )}

        <Button
          variant="contained"
          startIcon={<PhotoCamera />}
          onClick={capture}
          sx={{ mt: 2 }}
          disabled={hasPhoto || !selectedDevice}
        >
          Take Photo
        </Button>
      </Paper>
    </Box>
  )
}

export default WebcamCapture 