// Load API key directly
let API_KEY = '';
fetch('API_KEYS.txt')
    .then(response => response.text())
    .then(text => {
        const lines = text.split('\n');
        lines.forEach(line => {
            if (line.includes('OpenWeatherAPI_KEY =')) {
                API_KEY = line.split('=')[1].trim();
            }
        });
    });
const BASE_URL = 'https://api.openweathermap.org/data/3.0';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const RATE_LIMIT_DELAY = 2000; // 2 seconds between calls

let lastSearchTime = 0;
let isSearching = false;

// Track API usage
function getApiUsage() {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem('apiUsage') || '{}');
    return usage[today] || 0;
}

function incrementApiUsage() {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem('apiUsage') || '{}');
    usage[today] = (usage[today] || 0) + 1;
    localStorage.setItem('apiUsage', JSON.stringify(usage));
}

function checkApiLimit() {
    const usage = getApiUsage();
    if (usage >= 900) { // Warning at 900 calls
        showError(`API limit warning: ${usage}/1000 calls used today. Please use cached data.`);
        return false;
    }
    return true;
}

// Cache functions
function getCachedWeather(location) {
    const cache = JSON.parse(localStorage.getItem('weatherCache') || '{}');
    const cached = cache[location.toLowerCase()];
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedWeather(location, data) {
    const cache = JSON.parse(localStorage.getItem('weatherCache') || '{}');
    cache[location.toLowerCase()] = {
        data: data,
        timestamp: Date.now()
    };
    localStorage.setItem('weatherCache', JSON.stringify(cache));
}

document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('searchBtn');
    const locationInput = document.getElementById('locationInput');
    const retryBtn = document.getElementById('retryBtn');
    const locationBtn = document.getElementById('locationBtn');
    const testThemeBtn = document.getElementById('testThemeBtn');

    searchBtn.addEventListener('click', searchWeather);
    retryBtn.addEventListener('click', searchWeather);
    locationBtn.addEventListener('click', getCurrentLocation);
    testThemeBtn.addEventListener('click', testRandomTheme);
    
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });

    // Display usage info
    updateUsageDisplay();
});

function updateUsageDisplay() {
    const weatherUsage = getApiUsage();
    const usageInfo = document.getElementById('usageInfo');
    
    usageInfo.textContent = `API calls today: ${weatherUsage}/1000`;
    
    // Color coding for warnings
    if (weatherUsage >= 800) {
        usageInfo.style.background = '#ffe6e6';
        usageInfo.style.color = '#d63031';
    } else if (weatherUsage >= 500) {
        usageInfo.style.background = '#fff3cd';
        usageInfo.style.color = '#856404';
    }
}

async function searchWeather() {
    const location = document.getElementById('locationInput').value.trim();
    
    if (!location) {
        showError('Please enter a city name');
        return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSearchTime < RATE_LIMIT_DELAY) {
        showError('Please wait before searching again');
        return;
    }

    if (isSearching) {
        showError('Search in progress, please wait');
        return;
    }

    // Check cache first
    const cachedData = getCachedWeather(location);
    if (cachedData) {
        displayWeatherAndForecast(cachedData);
        return;
    }

    // Check API limit
    if (!checkApiLimit()) {
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
        
        // Get comprehensive data using OneCall API 3.0
        const oneCallResponse = await fetch(`${BASE_URL}/onecall?lat=${geoData.coord.lat}&lon=${geoData.coord.lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
        
        if (!oneCallResponse.ok) {
            throw new Error('Weather data not available');
        }

        const oneCallData = await oneCallResponse.json();
        
        // Combine current weather with OneCall data
        const combinedData = {
            name: geoData.name,
            current: {
                temp: oneCallData.current.temp,
                humidity: oneCallData.current.humidity,
                wind_speed: oneCallData.current.wind_speed,
                weather: oneCallData.current.weather
            },
            hourly: oneCallData.hourly.slice(0, 24), // Take first 24 hours
            daily: oneCallData.daily.slice(0, 7) // Take 7 days
        };
        
        // Cache the result
        setCachedWeather(location, combinedData);
        
        // Track API usage (2 calls: weather + onecall)
        incrementApiUsage();
        incrementApiUsage();
        updateUsageDisplay();
        
        displayWeatherAndForecast(combinedData);
    } catch (error) {
        showError('City not found. Please try again.');
    } finally {
        isSearching = false;
    }
}

function displayWeatherAndForecast(data) {
    hideLoading();
    hideError();

    // Display current weather
    document.getElementById('locationName').textContent = data.name;
    document.getElementById('currentTemp').textContent = Math.round(data.current.temp);
    document.getElementById('weatherDescription').textContent = data.current.weather[0].description;
    document.getElementById('humidity').textContent = data.current.humidity;
    document.getElementById('windSpeed').textContent = Math.round(data.current.wind_speed * 3.6);
    
    // Display current time
    updateTimeDisplay();

    // Apply dynamic theming based on weather conditions
    applyWeatherTheme(data.current);

    document.getElementById('weather').style.display = 'block';
    
    // Display forecasts if available
    if (data.hourly) {
        displayForecast(data.hourly);
    }
    if (data.daily) {
        display7DayForecast(data.daily);
    }
}

function displayWeather(data) {
    hideLoading();
    hideError();

    document.getElementById('locationName').textContent = data.name;
    document.getElementById('currentTemp').textContent = Math.round(data.main.temp);
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = data.main.humidity;
    document.getElementById('windSpeed').textContent = Math.round(data.wind.speed * 3.6);

    document.getElementById('weather').style.display = 'block';
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('error').style.display = 'block';
    hideLoading();
    hideWeather();
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function hideWeather() {
    document.getElementById('weather').style.display = 'none';
}

function hideForecast() {
    document.getElementById('forecast').style.display = 'none';
}

// Function to get weather by coordinates (called from geolocation.js)
async function getWeatherByCoords(lat, lon) {
    // Check cache first
    const cacheKey = `${lat},${lon}`;
    const cachedData = getCachedWeather(cacheKey);
    if (cachedData) {
        displayWeatherAndForecast(cachedData);
        return;
    }

    // Check API limit
    if (!checkApiLimit()) {
        return;
    }

    showLoading();
    hideError();
    hideWeather();
    hideForecast();
    isSearching = true;

    try {
        // Get current weather data for city name
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        if (!weatherResponse.ok) {
            throw new Error('Weather data not found');
        }

        const weatherData = await weatherResponse.json();
        
        // Get comprehensive data using OneCall API 3.0
        const oneCallResponse = await fetch(`${BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&exclude=minutely,alerts`);
        
        if (!oneCallResponse.ok) {
            throw new Error('Weather data not available');
        }

        const oneCallData = await oneCallResponse.json();
        
        const combinedData = {
            name: weatherData.name,
            current: {
                temp: oneCallData.current.temp,
                humidity: oneCallData.current.humidity,
                wind_speed: oneCallData.current.wind_speed,
                weather: oneCallData.current.weather
            },
            hourly: oneCallData.hourly.slice(0, 24), // Take first 24 hours
            daily: oneCallData.daily.slice(0, 7) // Take 7 days
        };
        
        // Cache the result
        setCachedWeather(cacheKey, combinedData);
        
        // Track API usage (2 calls: weather + onecall)
        incrementApiUsage();
        incrementApiUsage();
        updateUsageDisplay();
        
        displayWeatherAndForecast(combinedData);
    } catch (error) {
        showError('Failed to get weather data. Please try again.');
    } finally {
        isSearching = false;
    }
}


function displayForecast(hourlyData) {
    const forecastContainer = document.getElementById('forecast');
    const hourlyChart = document.getElementById('hourlyChart');
    
    // Take first 24 hours
    const next24Hours = hourlyData.slice(0, 24);
    
    hourlyChart.innerHTML = '';
    
    next24Hours.forEach(hour => {
        const hourItem = document.createElement('div');
        hourItem.className = 'hour-item';
        
        const time = new Date(hour.dt * 1000);
        const hourTime = time.getHours();
        const timeString = hourTime === 0 ? '12AM' : 
                          hourTime < 12 ? `${hourTime}AM` : 
                          hourTime === 12 ? '12PM' : 
                          `${hourTime - 12}PM`;
        
        // Handle OneCall API 3.0 structure
        const temp = Math.round(hour.temp || 0);
        const pop = Math.round((hour.pop || 0) * 100);
        const icon = hour.weather?.[0]?.icon || '01d';
        const description = hour.weather?.[0]?.description || 'Clear sky';
        
        hourItem.innerHTML = `
            <div class="hour-time">${timeString}</div>
            <div class="hour-icon">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
            </div>
            <div class="hour-temp">${temp}°</div>
            <div class="hour-pop">${pop}%</div>
        `;
        
        hourlyChart.appendChild(hourItem);
    });
    
    forecastContainer.style.display = 'block';
}

function display7DayForecast(dailyData) {
    const forecastContainer = document.getElementById('sevenDayForecast');
    const dailyChart = document.getElementById('dailyChart');
    
    // Take 7 days
    const next7Days = dailyData.slice(0, 7);
    
    dailyChart.innerHTML = '';
    
    next7Days.forEach((day, index) => {
        const dayItem = document.createElement('div');
        dayItem.className = 'day-item';
        
        const date = new Date(day.dt * 1000);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = index === 0 ? 'Today' : dayNames[date.getDay()];
        
        const minTemp = Math.round(day.temp?.min || 0);
        const maxTemp = Math.round(day.temp?.max || 0);
        const icon = day.weather?.[0]?.icon || '01d';
        const description = day.weather?.[0]?.description || 'Clear sky';
        
        dayItem.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-icon">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
            </div>
            <div class="day-temps">
                <span class="max-temp">${maxTemp}°</span>
                <span class="min-temp">${minTemp}°</span>
            </div>
            <div class="day-description">${description}</div>
        `;
        
        dailyChart.appendChild(dayItem);
    });
    
    forecastContainer.style.display = 'block';
}

// Dynamic Weather Theming System
function applyWeatherTheme(weatherData) {
    const temp = weatherData.temp;
    const weatherId = weatherData.weather[0].id;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const currentHour = new Date().getHours();
    
    // Determine theme based on multiple factors
    const theme = determineWeatherTheme(temp, weatherId, weatherMain, currentHour);
    
    // Apply the theme to the body
    applyThemeToBody(theme);
}

function determineWeatherTheme(temp, weatherId, weatherMain, currentHour) {
    // Time-based theming (day/night)
    const isNight = currentHour < 6 || currentHour > 18;
    
    // Temperature-based theming
    let tempTheme = '';
    if (temp < 0) {
        tempTheme = 'freezing'; // Deep blue/white
    } else if (temp < 10) {
        tempTheme = 'cold'; // Blue
    } else if (temp < 20) {
        tempTheme = 'cool'; // Light blue/teal
    } else if (temp < 30) {
        tempTheme = 'warm'; // Yellow/orange
    } else {
        tempTheme = 'hot'; // Red/orange
    }
    
    // Weather condition theming
    let weatherTheme = '';
    if (weatherMain.includes('rain') || weatherMain.includes('drizzle')) {
        weatherTheme = 'rainy';
    } else if (weatherMain.includes('snow')) {
        weatherTheme = 'snowy';
    } else if (weatherMain.includes('cloud')) {
        weatherTheme = 'cloudy';
    } else if (weatherMain.includes('clear') || weatherMain.includes('sun')) {
        weatherTheme = 'sunny';
    } else if (weatherMain.includes('storm') || weatherMain.includes('thunder')) {
        weatherTheme = 'stormy';
    } else if (weatherMain.includes('fog') || weatherMain.includes('mist')) {
        weatherTheme = 'foggy';
    }
    
    console.log(`🌡️ Theme determination:`, {
        temp: temp,
        weatherMain: weatherMain,
        currentHour: currentHour,
        isNight: isNight,
        tempTheme: tempTheme,
        weatherTheme: weatherTheme
    });
    
    // Combine themes
    return {
        temp: tempTheme,
        weather: weatherTheme,
        time: isNight ? 'night' : 'day',
        combined: `${tempTheme}-${weatherTheme}-${isNight ? 'night' : 'day'}`
    };
}

function applyThemeToBody(theme) {
    const root = document.documentElement;
    
    // Define theme colors based on temperature, weather, and time
    const themeColors = getThemeColors(theme.temp, theme.weather, theme.time);
    
    // Apply CSS variables
    root.style.setProperty('--theme-bg-1', themeColors.bg1);
    root.style.setProperty('--theme-bg-2', themeColors.bg2);
    root.style.setProperty('--theme-bg-3', themeColors.bg3);
    root.style.setProperty('--theme-text', themeColors.text);
    root.style.setProperty('--theme-accent', themeColors.accent);
    
    console.log(`🎨 Applied dynamic theme:`, {
        temp: theme.temp,
        weather: theme.weather,
        time: theme.time,
        colors: themeColors
    });
}

function getThemeColors(temp, weather, time) {
    // Base colors by temperature
    let baseColors = {};
    
    if (temp === 'freezing') {
        baseColors = { bg1: '#1e3c72', bg2: '#2a5298', bg3: '#87ceeb', text: '#ecf0f1', accent: '#87ceeb' };
    } else if (temp === 'cold') {
        baseColors = { bg1: '#4a90e2', bg2: '#7bb3f0', bg3: '#a8d8ea', text: '#2c3e50', accent: '#4a90e2' };
    } else if (temp === 'cool') {
        baseColors = { bg1: '#5dade2', bg2: '#85c1e9', bg3: '#aed6f1', text: '#2c3e50', accent: '#5dade2' };
    } else if (temp === 'warm') {
        baseColors = { bg1: '#f39c12', bg2: '#f7dc6f', bg3: '#f8c471', text: '#2c3e50', accent: '#f39c12' };
    } else if (temp === 'hot') {
        baseColors = { bg1: '#e74c3c', bg2: '#f1948a', bg3: '#f5b7b1', text: '#2c3e50', accent: '#e74c3c' };
    }
    
    // Modify colors based on weather conditions
    if (weather === 'rainy') {
        baseColors.bg1 = '#34495e';
        baseColors.bg2 = '#5d6d7e';
        baseColors.bg3 = '#85929e';
        baseColors.text = '#ecf0f1';
    } else if (weather === 'snowy') {
        baseColors.bg1 = '#d5dbdb';
        baseColors.bg2 = '#e8f4f8';
        baseColors.bg3 = '#f8f9f9';
        baseColors.text = '#2c3e50';
    } else if (weather === 'cloudy') {
        baseColors.bg1 = '#7f8c8d';
        baseColors.bg2 = '#95a5a6';
        baseColors.bg3 = '#bdc3c7';
        baseColors.text = '#2c3e50';
    } else if (weather === 'sunny') {
        baseColors.bg1 = '#f1c40f';
        baseColors.bg2 = '#f7dc6f';
        baseColors.bg3 = '#f9e79f';
        baseColors.text = '#2c3e50';
    } else if (weather === 'stormy') {
        baseColors.bg1 = '#2c3e50';
        baseColors.bg2 = '#34495e';
        baseColors.bg3 = '#5d6d7e';
        baseColors.text = '#ecf0f1';
    } else if (weather === 'foggy') {
        baseColors.bg1 = '#bdc3c7';
        baseColors.bg2 = '#d5dbdb';
        baseColors.bg3 = '#e8f4f8';
        baseColors.text = '#5d6d7e';
    }
    
    // Modify colors based on time of day
    if (time === 'night') {
        // Darken the colors for night
        baseColors.bg1 = darkenColor(baseColors.bg1, 0.3);
        baseColors.bg2 = darkenColor(baseColors.bg2, 0.2);
        baseColors.bg3 = darkenColor(baseColors.bg3, 0.1);
        baseColors.text = '#ecf0f1';
    }
    
    return baseColors;
}

function darkenColor(color, amount) {
    // Simple color darkening function
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

function updateTimeDisplay() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    document.getElementById('timeDisplay').textContent = timeString;
    
    // Update time every minute
    setTimeout(updateTimeDisplay, 60000);
}


