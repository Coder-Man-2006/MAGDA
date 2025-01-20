import { Grid, Card, CardMedia, CardContent, Typography, CardActions, Button, Chip, Stack } from '@mui/material'
import { Visibility, Try, Person, Wc, ChildCare } from '@mui/icons-material'

interface Frame {
  brand: string
  model: string
  frame_shape: string
  price: number
  image_links: string
  gender: string
  age_group: string
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
              alt={`${frame.brand} ${frame.model}`}
              sx={{ objectFit: 'contain', p: 2 }}
            />
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                {frame.brand}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {frame.model}
              </Typography>
              <Typography variant="h6" component="div" color="primary" gutterBottom>
                ${frame.price}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip 
                  label={frame.frame_shape}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  icon={frame.gender === 'unisex' ? <Wc /> : <Person />}
                  label={frame.gender}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
                <Chip 
                  icon={frame.age_group === 'children' ? <ChildCare /> : <Person />}
                  label={frame.age_group}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Stack>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => window.open(frame.image_links, '_blank')}
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
      {frames.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="h6" color="text.secondary" align="center">
            No frames found matching your criteria
          </Typography>
        </Grid>
      )}
    </Grid>
  )
}

export default FrameList 