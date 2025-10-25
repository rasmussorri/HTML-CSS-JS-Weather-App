# Weather App MVP

A simple weather application built with HTML, CSS, and JavaScript. Search for any city and get current weather information.

## Features

- Search for weather by city name
- Display current temperature, description, humidity, and wind speed
- Responsive design for mobile and desktop
- Simple, clean interface

## Getting Started

1. Open `index.html` in your web browser
2. Enter a city name and click Search
3. View the weather information

## API Setup

To use the app, you need an OpenWeatherMap API key:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Replace `demo` with your API key in `js/weather.js`:

```javascript
const API_KEY = 'your-api-key-here';
```

## Project Structure

```
weather-app/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # CSS styles
├── js/
│   └── weather.js      # JavaScript functionality
└── README.md           # This file
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- OpenWeatherMap API
