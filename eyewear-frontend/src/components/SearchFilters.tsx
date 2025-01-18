import { useEffect } from 'react'
import { Box, TextField, MenuItem } from '@mui/material'
import axios from 'axios'

interface SearchFiltersProps {
  filters: {
    shape: string
    minPrice: string
    maxPrice: string
  }
  setFilters: (filters: any) => void
  setFrames: (frames: any[]) => void
}

const shapes = ['all', 'round', 'oval', 'square', 'heart', 'oblong']

const SearchFilters = ({ filters, setFilters, setFrames }: SearchFiltersProps) => {
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const params: any = {}
        if (filters.shape && filters.shape !== 'all') {
          params.shape = filters.shape
        }
        if (filters.minPrice) {
          params.min_price = parseFloat(filters.minPrice)
        }
        if (filters.maxPrice) {
          params.max_price = parseFloat(filters.maxPrice)
        }

        const response = await axios.get('http://localhost:8000/frames', { params })
        setFrames(response.data)
      } catch (error) {
        console.error('Error fetching frames:', error)
      }
    }

    fetchFrames()
  }, [filters, setFrames])

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [field]: event.target.value })
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      my: 3,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      <TextField
        select
        label="Frame Shape"
        value={filters.shape}
        onChange={handleChange('shape')}
        sx={{ minWidth: 200 }}
      >
        {shapes.map((shape) => (
          <MenuItem key={shape} value={shape}>
            {shape.charAt(0).toUpperCase() + shape.slice(1)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Min Price"
        type="number"
        value={filters.minPrice}
        onChange={handleChange('minPrice')}
        sx={{ width: 150 }}
      />

      <TextField
        label="Max Price"
        type="number"
        value={filters.maxPrice}
        onChange={handleChange('maxPrice')}
        sx={{ width: 150 }}
      />
    </Box>
  )
}

export default SearchFilters 