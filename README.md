# Image to WebP Converter

A simple REST API service that converts PNG/JPG/JPEG images to WebP format.

## Features

- Convert images from URL to WebP format
- Adjustable quality settings
- Returns base64 encoded WebP image
- CORS enabled
- Fast conversion using Sharp library

## API Endpoints

### POST /convert

Convert an image to WebP format.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.png",
  "quality": 80
}
```

**Response:**
```json
{
  "success": true,
  "format": "webp",
  "size": 12345,
  "base64": "...",
  "dataUrl": "data:image/webp;base64,..."
}
```

### GET /health

Health check endpoint.

## Deployment

This service is designed to be deployed on Railway, Vercel, or any Node.js hosting platform.

## Local Development

```bash
npm install
npm start
```

Service will run on port 3000 by default.