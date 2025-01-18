import { Grid, Card, CardMedia, CardContent, Typography, CardActions, Button } from '@mui/material'
import { Visibility, Try } from '@mui/icons-material'

interface Frame {
  image_links: string
  frame_shape: string
  price: number
}

interface FrameListProps {
  frames: Frame[]
}

const FrameList = ({ frames }: FrameListProps) => {
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {frames.map((frame, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={frame.image_links}
              alt={`Frame ${index + 1}`}
              sx={{ objectFit: 'contain', p: 2 }}
            />
            <CardContent>
              <Typography variant="h6" component="div">
                ${frame.price}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shape: {frame.frame_shape}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<Visibility />}
              >
                View Product
              </Button>
              <Button 
                size="small" 
                variant="contained"
                startIcon={<Try />}
              >
                Live Try On
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default FrameList 