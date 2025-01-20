import { useEffect, useState } from 'react'
import { Box, TextField, MenuItem, FormControl, InputLabel, Select, Grid, SelectChangeEvent } from '@mui/material'
import axios from 'axios'

interface SearchFiltersProps {
  filters: {
    shape: string
    minPrice: string
    maxPrice: string
    gender: string
    ageGroup: string
  }
  setFilters: (filters: any) => void
  setFrames: (frames: any[]) => void
}

interface FilterOptions {
  brands: string[]
  frame_shapes: string[]
  genders: string[]
  age_groups: string[]
  price_range: {
    min: number
    max: number
  }
}

const SearchFilters = ({ filters, setFilters, setFrames }: SearchFiltersProps) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)

  useEffect(() => {
    // Fetch available filter options
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get('http://localhost:8000/filters')
        setFilterOptions(response.data)
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchFilterOptions()
  }, [])

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
        if (filters.gender && filters.gender !== 'all') {
          params.gender = filters.gender
        }
        if (filters.ageGroup && filters.ageGroup !== 'all') {
          params.age_group = filters.ageGroup
        }

        const response = await axios.get('http://localhost:8000/frames', { params })
        setFrames(response.data)
      } catch (error) {
        console.error('Error fetching frames:', error)
      }
    }

    fetchFrames()
  }, [filters, setFrames])

  const handleSelectChange = (field: string) => (event: SelectChangeEvent<string>) => {
    setFilters({ ...filters, [field]: event.target.value as string })
  }

  const handleNumberChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [field]: event.target.value })
  }

  if (!filterOptions) return null

  return (
    <Grid container spacing={2} sx={{ my: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth>
          <InputLabel>Frame Shape</InputLabel>
          <Select
            value={filters.shape}
            label="Frame Shape"
            onChange={handleSelectChange('shape')}
          >
            <MenuItem value="all">All Shapes</MenuItem>
            {filterOptions.frame_shapes.map((shape) => (
              <MenuItem key={shape} value={shape}>
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            value={filters.gender}
            label="Gender"
            onChange={handleSelectChange('gender')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="unisex">Unisex</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <FormControl fullWidth>
          <InputLabel>Age Group</InputLabel>
          <Select
            value={filters.ageGroup}
            label="Age Group"
            onChange={handleSelectChange('ageGroup')}
          >
            <MenuItem value="all">All Ages</MenuItem>
            <MenuItem value="adult">Adult</MenuItem>
            <MenuItem value="children">Children</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          label="Min Price"
          type="number"
          value={filters.minPrice}
          onChange={handleNumberChange('minPrice')}
          inputProps={{
            min: filterOptions.price_range.min,
            max: filterOptions.price_range.max
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <TextField
          fullWidth
          label="Max Price"
          type="number"
          value={filters.maxPrice}
          onChange={handleNumberChange('maxPrice')}
          inputProps={{
            min: filterOptions.price_range.min,
            max: filterOptions.price_range.max
          }}
        />
      </Grid>
    </Grid>
  )
}

export default SearchFilters 