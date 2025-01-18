import { useState } from 'react'
import { Box, Container, Typography, CircularProgress } from '@mui/material'
import WebcamCapture from './components/WebcamCapture'
import FrameList from './components/FrameList'
import SearchFilters from './components/SearchFilters'

interface Frame {
  image_links: string;
  frame_shape: string;
  price: number;
}

function App() {
  const [faceShape, setFaceShape] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [frames, setFrames] = useState<Frame[]>([])
  const [filters, setFilters] = useState({
    shape: '',
    minPrice: '',
    maxPrice: ''
  })

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Virtual Eyewear Try-On
        </Typography>
        
        <WebcamCapture 
          setFaceShape={setFaceShape}
          setFrames={setFrames}
          setIsLoading={setIsLoading}
        />

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {faceShape && (
          <Typography variant="h5" sx={{ my: 2 }}>
            Detected Face Shape: {faceShape}
          </Typography>
        )}

        {frames.length > 0 && (
          <>
            <SearchFilters 
              filters={filters}
              setFilters={setFilters}
              setFrames={setFrames}
            />
            <FrameList frames={frames} />
          </>
        )}
      </Box>
    </Container>
  )
}

export default App
