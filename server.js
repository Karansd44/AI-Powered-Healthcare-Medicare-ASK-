const express = require('express');
const cors = require('cors');
const { Client } = require('@googlemaps/google-maps-services-js');
require('dotenv').config();

const app = express();
const port = process.env.REACT_APP_SERVER_PORT || 3005;

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize Google Maps client
const client = new Client({});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', results: [] });
});

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Add OPTIONS handling for preflight requests
app.options('/api/places/nearbysearch', cors());

// Add photo endpoint for Google Places photos
app.get('/api/places/photo', async (req, res) => {
  try {
    const { photoreference, maxwidth } = req.query;
    
    if (!photoreference) {
      return res.status(400).json({ error: 'Photo reference is required' });
    }

    const response = await client.placePhoto({
      params: {
        photoreference,
        maxwidth: maxwidth || 400,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
      responseType: 'stream',
    });

    // Set appropriate headers
    res.set('Content-Type', 'image/jpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Error fetching photo' });
  }
});

// Endpoint to search for nearby hospitals
app.get('/api/places/nearbysearch', async (req, res) => {
  try {
    console.log('Received request for nearby search:', req.query);
    const { location, radius = 5000, type = 'hospital', keyword } = req.query;

    if (!location) {
      console.log('No location provided');
      return res.status(400).json({ 
        error: 'Location is required',
        results: []
      });
    }

    const [lat, lng] = location.split(',').map(Number);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        error: 'Invalid location format',
        results: [] 
      });
    }

    console.log('Attempting Google Places API request with params:', {
      lat,
      lng,
      radius,
      type,
      keyword
    });

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return res.status(500).json({
        error: 'Server configuration error: API key is missing',
        results: []
      });
    }

    const response = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: Number(radius),
        type,
        keyword,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    console.log('Google Places API response status:', response.data.status);

    // Ensure we have a valid response
    if (response.data && response.data.status === 'OK') {
      res.json({
        results: response.data.results || [],
        status: 'OK'
      });
    } else {
      res.json({
        results: [],
        status: response.data.status,
        error: 'No results found'
      });
    }
  } catch (error) {
    console.error('Error searching places:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({ 
      error: `Error searching for places: ${error.message}`,
      details: error.response?.data?.error_message || 'Unknown error',
      results: []
    });
  }
});

// Geocoding endpoint for manual location search
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ 
        error: 'Address parameter is required',
        results: []
      });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      return res.status(500).json({
        error: 'Server configuration error: API key is missing',
        results: []
      });
    }

    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    console.log('Geocoding API response status:', response.data.status);

    if (response.data && response.data.status === 'OK') {
      res.json({
        results: response.data.results || [],
        status: 'OK'
      });
    } else {
      res.json({
        results: [],
        status: response.data.status,
        error: 'Location not found'
      });
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    res.status(500).json({ 
      error: `Error geocoding address: ${error.message}`,
      results: []
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
