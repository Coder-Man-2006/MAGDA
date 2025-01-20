import { useEffect, useRef, useState } from 'react'
import { CircularProgress, Typography } from '@mui/material'

interface FaceMeshOverlayProps {
  videoElement: HTMLVideoElement | null
  width: number
  height: number
}

// Key facial feature points for special highlighting
const SPECIAL_POINTS = {
  nose: [5, 4, 6, 197, 195, 197],
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263],
  leftEyebrow: [276, 283, 282, 295, 285],
  rightEyebrow: [46, 53, 52, 65, 55],
  lips: [0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61, 185, 40, 39, 37],
  faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
}

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe'
const MEDIAPIPE_VERSION = '0.4.1633559619'

const FaceMeshOverlay = ({ videoElement, width, height }: FaceMeshOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameCountRef = useRef(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const faceMeshRef = useRef<any>(null)
  const animationFrameIdRef = useRef<number>()
  const retryTimeoutRef = useRef<number>()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const MAX_RETRIES = 3

    const initializeFaceMesh = async () => {
      if (!window.FaceMesh) {
        throw new Error('FaceMesh not loaded')
      }

      if (faceMeshRef.current) {
        await faceMeshRef.current.close()
      }

      faceMeshRef.current = new window.FaceMesh({
        locateFile: (file: string) => {
          return `${MEDIAPIPE_CDN}/face_mesh@${MEDIAPIPE_VERSION}/${file}`
        }
      })

      await faceMeshRef.current.initialize()

      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })

      faceMeshRef.current.onResults(onResults)
      isInitializedRef.current = true
    }

    const setup = async () => {
      try {
        if (!isInitializedRef.current) {
          await initializeFaceMesh()
        }
        setIsLoading(false)
        retryCount = 0
      } catch (err) {
        console.error('Error initializing Face Mesh:', err)
        
        if (isMounted && retryCount < MAX_RETRIES) {
          retryCount++
          console.log(`Retrying initialization (${retryCount}/${MAX_RETRIES})...`)
          retryTimeoutRef.current = window.setTimeout(setup, 1000 * retryCount)
        } else if (isMounted) {
          setError('Failed to initialize face tracking. Please refresh and try again.')
          setIsLoading(false)
        }
      }
    }

    setup()

    return () => {
      isMounted = false
      isInitializedRef.current = false
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current)
      }
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current)
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close()
      }
    }
  }, [])

  const onResults = (results: any) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    frameCountRef.current++
    ctx.clearRect(0, 0, width, height)

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // Draw base mesh with subtle lines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'
        ctx.lineWidth = 0.5

        // Animate mesh opacity based on frame count
        const meshOpacity = Math.sin(frameCountRef.current * 0.02) * 0.1 + 0.3
        ctx.strokeStyle = `rgba(0, 255, 255, ${meshOpacity})`

        // Draw mesh connections with error handling
        try {
          const connections = window.FACEMESH_TESSELATION
          if (connections) {
            for (const connection of connections) {
              const start = landmarks[connection[0]]
              const end = landmarks[connection[1]]
              if (start && end) {
                drawFeatureLine(ctx, start, end, ctx.strokeStyle)
              }
            }
          }

          // Draw special feature points with animations
          Object.entries(SPECIAL_POINTS).forEach(([feature, points]) => {
            const pulseRadius = Math.sin(frameCountRef.current * 0.05) * 0.5 + 1.5
            
            points.forEach((point) => {
              const landmark = landmarks[point]
              if (landmark) {
                const x = landmark.x * width
                const y = landmark.y * height

                switch (feature) {
                  case 'nose':
                    drawFeaturePoint(ctx, x, y, 2 * pulseRadius, '#00ffff', 'rgba(0, 255, 255, 0.3)')
                    break
                  case 'leftEye':
                  case 'rightEye':
                    drawFeaturePoint(ctx, x, y, 1.5 * pulseRadius, '#ff00ff', 'rgba(255, 0, 255, 0.3)')
                    break
                  case 'leftEyebrow':
                  case 'rightEyebrow':
                    drawFeaturePoint(ctx, x, y, 1.5 * pulseRadius, '#ffff00', 'rgba(255, 255, 0, 0.3)')
                    break
                  case 'lips':
                    drawFeaturePoint(ctx, x, y, 1.5 * pulseRadius, '#ff0080', 'rgba(255, 0, 128, 0.3)')
                    break
                  case 'faceOval':
                    drawFeaturePoint(ctx, x, y, 2 * pulseRadius, '#00ff80', 'rgba(0, 255, 128, 0.3)')
                    break
                }
              }
            })
          })

          // Draw scanning effect
          const scanLineY = (frameCountRef.current % height)
          const gradient = ctx.createLinearGradient(0, scanLineY - 10, 0, scanLineY + 10)
          gradient.addColorStop(0, 'transparent')
          gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)')
          gradient.addColorStop(1, 'transparent')
          
          ctx.fillStyle = gradient
          ctx.fillRect(0, scanLineY - 10, width, 20)
        } catch (err) {
          console.error('Error drawing face mesh:', err)
        }
      }
    }
  }

  const drawFeaturePoint = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    glowColor: string
  ) => {
    ctx.beginPath()
    
    // Outer glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2)
    gradient.addColorStop(0, glowColor)
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.arc(x, y, radius * 2, 0, 2 * Math.PI)
    ctx.fill()

    // Inner point
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
  }

  const drawFeatureLine = (
    ctx: CanvasRenderingContext2D,
    start: { x: number, y: number },
    end: { x: number, y: number },
    color: string
  ) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.moveTo(start.x * width, start.y * height)
    ctx.lineTo(end.x * width, end.y * height)
    ctx.stroke()
  }

  useEffect(() => {
    if (!videoElement || !faceMeshRef.current || !isInitializedRef.current) return

    const animate = async () => {
      try {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          await faceMeshRef.current.send({ image: videoElement })
        }
      } catch (err) {
        console.error('Error processing video frame:', err)
        if (err instanceof Error && err.message.includes('not initialized')) {
          isInitializedRef.current = false
          setError('Face tracking lost. Please refresh the page.')
        }
      }
      animationFrameIdRef.current = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameIdRef.current) {
        window.cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [videoElement, width, height])

  if (isLoading) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <CircularProgress />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <Typography color="error">{error}</Typography>
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    />
  )
}

export default FaceMeshOverlay 