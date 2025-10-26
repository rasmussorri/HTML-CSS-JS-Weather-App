// Main weather API integration and search functionality

import { CONFIG, API_KEY, loadApiKeys } from './config.js';
import { checkApiLimit, incrementApiUsage, updateUsageDisplay } from './api-usage.js';
import { getWeatherFromFMI } from './fmi-api.js';
import { isInFinlandRegion, handleApiError } from './utils.js';
import { displayWeatherAndForecast, showLoading, hideLoading, showError, hideError, hideWeather, hideForecast, getCurrentLocationData, getCurrentTempUnit, setCurrentTempUnit } from './ui.js';

// Search state management
let lastSearchTime = 0;
let isSearching = false;

// Main weather search function
export async function searchWeather() {
    const locationInput = document.getElementById('locationInput');
    const multiSourceCheckbox = document.getElementById('multiSourceCheckbox');
    
    if (!locationInput) {
        showError('Location input not found');
        return;
    }
    
    const location = locationInput.value.trim();
    const multiSource = multiSourceCheckbox ? multiSourceCheckbox.checked : false;
    
    if (!location) {
        showError('Please enter a city name');
        return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSearchTime < CONFIG.RATE_LIMIT_DELAY) {
        showError('Please wait before searching again');
        return;
    }

    if (isSearching) {
        showError('Search in progress, please wait');
        return;
    }

    showLoading();
    hideError();
    hideWeather();
    hideForecast();
    isSearching = true;
    lastSearchTime = now;

    try {
        // First get coordinates for the city
        const geoResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);
        
        if (!geoResponse.ok) {
            throw new Error('City not found');
        }

        const geoData = await geoResponse.json();
        const lat = geoData.coord.lat;
        const lon = geoData.coord.lon;
        
        console.log(`🌡️ Searching weather for ${location} at coordinates ${lat}, ${lon}`);
        
        let hourlyData = null;
        let fmiData = null;
        let openWeatherData = null;
        let dataSource = 'OpenWeatherMap';
        
        // If multi-source is enabled, try to get both FMI and OpenWeather data
        if (multiSource) {
            console.log('🌡️ Multi-source search enabled, fetching from both sources');
            
            // Try FMI first (for any location, not just Finland)
            try {
                console.log('🌡️ Fetching FMI data');
                fmiData = await getWeatherFromFMI(lat, lon);
                console.log('🌡️ FMI data fetched successfully');
            } catch (fmiError) {
                console.warn('🌡️ FMI failed:', fmiError.message);
                fmiData = null;
            }
            
            // Always try OpenWeather as well
            try {
                console.log('🌡️ Fetching OpenWeatherMap data');
                
                // Check API limit
                if (!checkApiLimit()) {
                    throw new Error('API limit reached');
                }
                
                // Get comprehensive data using OneCall API 3.0
                const oneCallResponse = await fetch(`${CONFIG.BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
                
                if (!oneCallResponse.ok) {
                    throw new Error('OpenWeatherMap data not available');
                }

                const oneCallData = await oneCallResponse.json();
                openWeatherData = oneCallData.hourly.slice(0, 24);
                
                // Track API usage
                incrementApiUsage();
                incrementApiUsage();
                
                console.log('🌡️ OpenWeatherMap data fetched successfully');
            } catch (openWeatherError) {
                console.warn('🌡️ OpenWeatherMap failed:', openWeatherError.message);
                openWeatherData = null;
            }
            
            // Determine which data to use as primary
            if (fmiData && fmiData.length > 0) {
                hourlyData = fmiData;
                dataSource = 'FMI';
            } else if (openWeatherData && openWeatherData.length > 0) {
                hourlyData = openWeatherData;
                dataSource = 'OpenWeatherMap';
            } else {
                throw new Error('No weather data available from any source');
            }
            
        } else {
            // Single source mode - use existing logic
            // Check if location is in Finland or nearby
            if (isInFinlandRegion(lat, lon)) {
                console.log('🌡️ Location appears to be in Finland region, trying FMI first');
                
                try {
                    // Always fetch fresh FMI data
                    console.log('🌡️ Fetching fresh FMI data');
                    hourlyData = await getWeatherFromFMI(lat, lon);
                    dataSource = 'FMI';
                } catch (fmiError) {
                    console.warn('🌡️ FMI failed, falling back to OpenWeatherMap:', fmiError.message);
                    hourlyData = null;
                }
            }
            
            // Fallback to OpenWeatherMap if FMI failed or location is outside Finland
            if (!hourlyData) {
                console.log('🌡️ Using OpenWeatherMap as data source');
                
                // Check API limit
                if (!checkApiLimit()) {
                    return;
                }
                
                // Get comprehensive data using OneCall API 3.0
                const oneCallResponse = await fetch(`${CONFIG.BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
                
                if (!oneCallResponse.ok) {
                    throw new Error('Weather data not available');
                }

                const oneCallData = await oneCallResponse.json();
                hourlyData = oneCallData.hourly.slice(0, 24);
                
                // Track API usage (2 calls: weather + onecall)
                incrementApiUsage();
                incrementApiUsage();
            }
        }
        
        // Get current weather data for display
        const currentWeatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Get daily forecast for 7-day view
        const dailyResponse = await fetch(`${CONFIG.BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
        const dailyData = await dailyResponse.json();
        
        // Combine all data
        const combinedData = {
            name: geoData.name,
            current: {
                temp: currentWeatherData.main.temp,
                humidity: currentWeatherData.main.humidity,
                wind_speed: currentWeatherData.wind.speed,
                weather: currentWeatherData.weather
            },
            hourly: hourlyData,
            daily: dailyData.daily.slice(0, 7), // Take 7 days
            coord: { lat, lon },
            timezone_offset: dailyData.timezone_offset, // Timezone offset in seconds
            dataSource: dataSource,
            // Add multi-source data if available
            multiSource: multiSource,
            fmiData: fmiData,
            openWeatherData: openWeatherData
        };
        
        updateUsageDisplay();
        
        console.log(`🌡️ Weather data loaded successfully from ${dataSource}`);
        displayWeatherAndForecast(combinedData);
    } catch (error) {
        console.error('Error in searchWeather:', error);
        const errorMessage = handleApiError(error, 'weather search');
        showError(errorMessage);
    } finally {
        isSearching = false;
    }
}

// Function to get weather by coordinates (called from geolocation.js)
export async function getWeatherByCoords(lat, lon) {
    showLoading();
    hideError();
    hideWeather();
    hideForecast();
    isSearching = true;

    try {
        console.log(`🌡️ Getting weather by coordinates ${lat}, ${lon}`);
        
        // Try FMI first (for Finnish locations or nearby areas)
        let hourlyData = null;
        let dataSource = 'OpenWeatherMap';
        
        // Check if location is in Finland or nearby
        if (isInFinlandRegion(lat, lon)) {
            console.log('🌡️ Location appears to be in Finland region, trying FMI first');
            
            try {
                // Always fetch fresh FMI data
                console.log('🌡️ Fetching fresh FMI data');
                hourlyData = await getWeatherFromFMI(lat, lon);
                dataSource = 'FMI';
            } catch (fmiError) {
                console.warn('🌡️ FMI failed, falling back to OpenWeatherMap:', fmiError.message);
                hourlyData = null;
            }
        }
        
        // Fallback to OpenWeatherMap if FMI failed or location is outside Finland
        if (!hourlyData) {
            console.log('🌡️ Using OpenWeatherMap as data source');
            
            // Check API limit
            if (!checkApiLimit()) {
                return;
            }
            
            // Get comprehensive data using OneCall API 3.0
            const oneCallResponse = await fetch(`${CONFIG.BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
            
            if (!oneCallResponse.ok) {
                throw new Error('Weather data not available');
            }

            const oneCallData = await oneCallResponse.json();
            hourlyData = oneCallData.hourly.slice(0, 24);
            
            // Track API usage (2 calls: weather + onecall)
            incrementApiUsage();
            incrementApiUsage();
        }
        
        // Get current weather data for display
        const currentWeatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Get daily forecast for 7-day view
        const dailyResponse = await fetch(`${CONFIG.BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
        const dailyData = await dailyResponse.json();
        
        const combinedData = {
            name: currentWeatherData.name,
            current: {
                temp: currentWeatherData.main.temp,
                humidity: currentWeatherData.main.humidity,
                wind_speed: currentWeatherData.wind.speed,
                weather: currentWeatherData.weather
            },
            hourly: hourlyData,
            daily: dailyData.daily.slice(0, 7), // Take 7 days
            coord: { lat, lon },
            timezone_offset: dailyData.timezone_offset, // Timezone offset in seconds
            dataSource: dataSource
        };
        
        updateUsageDisplay();
        
        console.log(`🌡️ Weather data loaded successfully from ${dataSource}`);
        displayWeatherAndForecast(combinedData);
    } catch (error) {
        console.error('Error in getWeatherByCoords:', error);
        const errorMessage = handleApiError(error, 'coordinate weather lookup');
        showError(errorMessage);
    } finally {
        isSearching = false;
    }
}

// Initialize the weather app
export async function initializeWeatherApp() {
    // Load API keys
    await loadApiKeys();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize UI state
    initializeUI();
}

function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    const retryBtn = document.getElementById('retryBtn');
    const locationBtn = document.getElementById('locationBtn');
    const testThemeBtn = document.getElementById('testThemeBtn');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const addToFavoritesBtn = document.getElementById('addToFavoritesBtn');
    const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
    const tempUnitBtn = document.getElementById('tempUnitBtn');
    const locationInput = document.getElementById('locationInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', searchWeather);
    }
    if (retryBtn) {
        retryBtn.addEventListener('click', searchWeather);
    }
    if (locationBtn) {
        locationBtn.addEventListener('click', getCurrentLocation);
    }
    if (testThemeBtn) {
        testThemeBtn.addEventListener('click', testRandomTheme);
    }
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', toggleFavoritesDropdown);
    }
    if (tempUnitBtn) {
        tempUnitBtn.addEventListener('click', toggleTempUnitDropdown);
    }
    if (addToFavoritesBtn) {
        addToFavoritesBtn.addEventListener('click', handleAddToFavorites);
    }
    if (clearFavoritesBtn) {
        clearFavoritesBtn.addEventListener('click', clearAllFavorites);
    }
    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchWeather();
            }
        });
    }
}

function initializeUI() {
    // Initialize temperature unit
    const savedTempUnit = getTempUnit();
    setCurrentTempUnit(savedTempUnit);
    
    // Update usage display
    updateUsageDisplay();
    
    // Initialize favorites display
    updateFavoritesDisplay();
    updateAddToFavoritesButton(getCurrentLocationData());
}

// Import functions from other modules for event handlers
import { getTempUnit } from './temperature.js';
import { toggleTempUnitDropdown, setupTempUnitDropdownListeners } from './temperature.js';
import { toggleFavoritesDropdown, clearAllFavorites, addToFavorites, removeFromFavorites, isLocationInFavorites, getFavorites } from './favorites.js';
import { testRandomTheme } from './theming.js';
import { refreshWeatherDisplay } from './ui.js';

// Event handler functions
function handleAddToFavorites() {
    const currentLocation = getCurrentLocationData();
    if (currentLocation) {
        const favorites = getFavorites();
        if (isLocationInFavorites(currentLocation, favorites)) {
            removeFromFavorites(currentLocation);
        } else {
            addToFavorites(currentLocation);
        }
    }
}

// Setup temperature unit dropdown listeners
setupTempUnitDropdownListeners((unit) => {
    setCurrentTempUnit(unit);
    refreshWeatherDisplay();
});

// Make functions globally available for onclick handlers
window.getWeatherByCoords = getWeatherByCoords;
window.searchWeather = searchWeather;
window.getCurrentLocation = getCurrentLocation;
