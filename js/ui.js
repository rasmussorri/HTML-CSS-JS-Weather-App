// UI management and display functions

import { formatTemperature, formatTime } from './utils.js';
import { updateFavoritesDisplay, updateAddToFavoritesButton } from './favorites.js';
import { applyWeatherTheme } from './theming.js';
import { displayWeatherChart } from './charts.js';
import { loadWebcamsForLocation } from './webcams.js';

// UI State Management
let currentLocationData = null;
let currentTimezoneOffset = 0;
let currentTempUnit = 'celsius';

// UI Display Functions
export function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

export function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

export function showError(message) {
    const errorElement = document.getElementById('error');
    const errorMessageElement = document.getElementById('errorMessage');
    
    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
    if (errorElement) {
        errorElement.style.display = 'block';
    }
    
    hideLoading();
    hideWeather();
}

export function hideError() {
    const errorElement = document.getElementById('error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

export function hideWeather() {
    const weatherElement = document.getElementById('weather');
    if (weatherElement) {
        weatherElement.style.display = 'none';
    }
}

export function hideForecast() {
    const forecastElement = document.getElementById('forecast');
    if (forecastElement) {
        forecastElement.style.display = 'none';
    }
}

export function displayWeatherAndForecast(data) {
    hideLoading();
    hideError();

    // Store current location data for favorites
    currentLocationData = {
        name: data.name,
        coord: data.coord
    };

    // Store timezone offset for time display
    if (data.timezone_offset) {
        currentTimezoneOffset = data.timezone_offset;
        console.log(`🕐 Timezone offset for ${data.name}: ${currentTimezoneOffset} seconds`);
    }

    // Store current weather data for refresh functionality
    window.currentWeatherData = data;

    // Display current weather
    const locationNameElement = document.getElementById('locationName');
    const currentTempElement = document.getElementById('currentTemp');
    const weatherDescriptionElement = document.getElementById('weatherDescription');
    const humidityElement = document.getElementById('humidity');
    const windSpeedElement = document.getElementById('windSpeed');

    if (locationNameElement) {
        locationNameElement.textContent = data.name;
        
        // Display data source if available
        if (data.dataSource) {
            // Clear any existing data source info
            const existingDataSource = locationNameElement.querySelector('.data-source');
            if (existingDataSource) {
                existingDataSource.remove();
            }
            
            const dataSourceInfo = document.createElement('div');
            dataSourceInfo.className = 'data-source';
            
            if (data.multiSource && data.fmiData && data.openWeatherData) {
                dataSourceInfo.textContent = `Data: ${data.dataSource} + Comparison Available`;
            } else if (data.multiSource) {
                dataSourceInfo.textContent = `Data: ${data.dataSource} (Multi-source enabled)`;
            } else {
                dataSourceInfo.textContent = `Data: ${data.dataSource}`;
            }
            
            dataSourceInfo.style.fontSize = '0.8em';
            dataSourceInfo.style.opacity = '0.7';
            dataSourceInfo.style.marginTop = '5px';
            locationNameElement.appendChild(dataSourceInfo);
        }
    }

    if (currentTempElement) {
        currentTempElement.textContent = formatTemperature(data.current.temp, currentTempUnit);
    }
    if (weatherDescriptionElement) {
        weatherDescriptionElement.textContent = data.current.weather[0].description;
    }
    if (humidityElement) {
        humidityElement.textContent = data.current.humidity;
    }
    if (windSpeedElement) {
        windSpeedElement.textContent = Math.round(data.current.wind_speed * 3.6);
    }
    
    // Display current time in the location's timezone
    updateTimeDisplay();

    // Apply dynamic theming based on weather conditions
    applyWeatherTheme(data.current);

    // Load webcams for the current location
    if (data.coord) {
        loadWebcamsForLocation(data.coord.lat, data.coord.lon);
    }

    const weatherElement = document.getElementById('weather');
    if (weatherElement) {
        weatherElement.style.display = 'block';
    }
    
    // Display forecasts if available
    if (data.hourly) {
        displayForecast(data.hourly);
        
        // Try to display chart with error handling
        try {
            displayWeatherChart(data.hourly, data, currentTempUnit, currentTimezoneOffset);
        } catch (chartError) {
            console.error('Chart display failed:', chartError);
        }
    }
    
    if (data.daily) {
        display7DayForecast(data.daily);
    }
    
    // Update favorites button
    updateAddToFavoritesButton(currentLocationData);
}

export function displayForecast(hourlyData) {
    const forecastContainer = document.getElementById('forecast');
    const hourlyChart = document.getElementById('hourlyChart');
    
    if (!forecastContainer || !hourlyChart) return;
    
    // Take first 24 hours
    const next24Hours = hourlyData.slice(0, 24);
    
    hourlyChart.innerHTML = '';
    
    next24Hours.forEach(hour => {
        const hourItem = document.createElement('div');
        hourItem.className = 'hour-item';
        
        const timeString = formatTime(hour.dt, currentTimezoneOffset);
        const tempFormatted = formatTemperature(hour.temp || 0, currentTempUnit);
        const pop = Math.round((hour.pop || 0) * 100);
        const icon = hour.weather?.[0]?.icon || '01d';
        const description = hour.weather?.[0]?.description || 'Clear sky';
        
        hourItem.innerHTML = `
            <div class="hour-time">${timeString}</div>
            <div class="hour-weather">
                <div class="hour-icon">
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
                </div>
                <div class="hour-description">${description}</div>
            </div>
            <div class="hour-temp">${tempFormatted}</div>
            <div class="hour-pop">${pop}%</div>
        `;
        
        hourlyChart.appendChild(hourItem);
    });
    
    forecastContainer.style.display = 'block';
}

export function display7DayForecast(dailyData) {
    const forecastContainer = document.getElementById('sevenDayForecast');
    const dailyChart = document.getElementById('dailyChart');
    
    if (!forecastContainer || !dailyChart) return;
    
    // Take 7 days
    const next7Days = dailyData.slice(0, 7);
    
    dailyChart.innerHTML = '';
    
    next7Days.forEach((day, index) => {
        const dayItem = document.createElement('div');
        dayItem.className = 'day-item';
        
        const date = new Date(day.dt * 1000);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = index === 0 ? 'Today' : dayNames[date.getDay()];
        
        const minTempFormatted = formatTemperature(day.temp?.min || 0, currentTempUnit);
        const maxTempFormatted = formatTemperature(day.temp?.max || 0, currentTempUnit);
        const icon = day.weather?.[0]?.icon || '01d';
        const description = day.weather?.[0]?.description || 'Clear sky';
        
        dayItem.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-icon">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" />
            </div>
            <div class="day-temps">
                <span class="max-temp">${maxTempFormatted}</span>
                <span class="min-temp">${minTempFormatted}</span>
            </div>
            <div class="day-description">${description}</div>
        `;
        
        dailyChart.appendChild(dayItem);
    });
    
    forecastContainer.style.display = 'block';
}

export function updateTimeDisplay() {
    const now = new Date();
    
    let locationTime;
    
    if (currentTimezoneOffset !== 0) {
        // Calculate time in the searched location's timezone
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        locationTime = new Date(utcTime + (currentTimezoneOffset * 1000));
    } else {
        // Fallback to local time if no timezone data
        locationTime = now;
    }
    
    const hours = locationTime.getHours().toString().padStart(2, '0');
    const minutes = locationTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const timeDisplayElement = document.getElementById('timeDisplay');
    if (timeDisplayElement) {
        timeDisplayElement.textContent = timeString;
    }
    
    // Update time every minute
    setTimeout(updateTimeDisplay, 60000);
}

export function refreshWeatherDisplay() {
    // This will be called to refresh the display with new temperature units
    if (window.currentWeatherData) {
        displayWeatherAndForecast(window.currentWeatherData);
    }
}

// Getters for current state
export function getCurrentLocationData() {
    return currentLocationData;
}

export function getCurrentTempUnit() {
    return currentTempUnit;
}

export function setCurrentTempUnit(unit) {
    currentTempUnit = unit;
}

export function getCurrentTimezoneOffset() {
    return currentTimezoneOffset;
}
