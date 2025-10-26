// Configuration and constants
export const CONFIG = {
    // API Configuration
    BASE_URL: 'https://api.openweathermap.org/data/3.0',
    WINDY_BASE_URL: 'https://api.windy.com/webcams/api/v3',
    FMI_BASE_URL: 'https://opendata.fmi.fi/wfs',
    
    // Rate limiting
    RATE_LIMIT_DELAY: 2000, // 2 seconds between calls
    
    // API Limits
    WEATHER_API_LIMIT: 1000,
    WINDY_API_LIMIT: 500,
    WEATHER_API_WARNING: 900,
    WINDY_API_WARNING: 450,
    
    // Finland region bounds for FMI API
    FINLAND_BOUNDS: {
        LAT_MIN: 55,
        LAT_MAX: 70,
        LON_MIN: 19,
        LON_MAX: 32
    },
    
    // Chart configuration
    CHART_HEIGHTS: {
        MOBILE: 250,
        TABLET: 300,
        DESKTOP: 400
    },
    
    // Temperature units
    TEMP_UNITS: {
        CELSIUS: 'celsius',
        FAHRENHEIT: 'fahrenheit',
        KELVIN: 'kelvin'
    },
    
    // Default settings
    DEFAULT_TEMP_UNIT: 'celsius',
    DEFAULT_WEBCAM_RADIUS: 20
};

// API Keys (loaded dynamically)
export let API_KEY = '';
export let WINDY_API_KEY = '';

// Load API keys from file
export async function loadApiKeys() {
    try {
        const response = await fetch('API_KEYS.txt');
        const text = await response.text();
        const lines = text.split('\n');
        
        lines.forEach(line => {
            if (line.includes('OpenWeatherAPI_KEY =')) {
                API_KEY = line.split('=')[1].trim();
            }
            if (line.includes('WindyWebcamsAPI_KEY =')) {
                WINDY_API_KEY = line.split('=')[1].trim();
            }
        });
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}
