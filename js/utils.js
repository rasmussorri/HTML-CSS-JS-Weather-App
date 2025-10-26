// Utility functions for common operations

import { CONFIG } from './config.js';

// Temperature conversion utilities
export function convertTemperature(tempCelsius, targetUnit) {
    switch (targetUnit) {
        case CONFIG.TEMP_UNITS.CELSIUS:
            return tempCelsius;
        case CONFIG.TEMP_UNITS.FAHRENHEIT:
            return (tempCelsius * 9/5) + 32;
        case CONFIG.TEMP_UNITS.KELVIN:
            return tempCelsius + 273.15;
        default:
            return tempCelsius;
    }
}

export function getTempSymbol(unit) {
    switch (unit) {
        case CONFIG.TEMP_UNITS.CELSIUS:
            return '°C';
        case CONFIG.TEMP_UNITS.FAHRENHEIT:
            return '°F';
        case CONFIG.TEMP_UNITS.KELVIN:
            return 'K';
        default:
            return '°C';
    }
}

export function formatTemperature(tempCelsius, unit) {
    const convertedTemp = convertTemperature(tempCelsius, unit);
    const symbol = getTempSymbol(unit);
    
    // Round to appropriate decimal places
    let roundedTemp;
    if (unit === CONFIG.TEMP_UNITS.KELVIN) {
        roundedTemp = Math.round(convertedTemp * 10) / 10; // 1 decimal place for Kelvin
    } else {
        roundedTemp = Math.round(convertedTemp); // Whole numbers for Celsius and Fahrenheit
    }
    
    return `${roundedTemp}${symbol}`;
}

// Time utilities
export function formatTime(timestamp, timezoneOffset = 0) {
    const utcTime = timestamp * 1000; // Convert to milliseconds
    let localTime;
    
    if (timezoneOffset !== 0) {
        // Calculate time in the searched location's timezone
        const utcDate = new Date(utcTime);
        const utcTimeMs = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
        localTime = new Date(utcTimeMs + (timezoneOffset * 1000));
    } else {
        // Fallback to UTC time if no timezone data
        localTime = new Date(utcTime);
    }
    
    const hourTime = localTime.getHours();
    return hourTime === 0 ? '12AM' : 
           hourTime < 12 ? `${hourTime}AM` : 
           hourTime === 12 ? '12PM' : 
           `${hourTime - 12}PM`;
}

export function formatTime24Hour(timestamp, timezoneOffset = 0) {
    const utcTime = timestamp * 1000;
    let localTime;
    
    if (timezoneOffset !== 0) {
        const utcDate = new Date(utcTime);
        const utcTimeMs = utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000);
        localTime = new Date(utcTimeMs + (timezoneOffset * 1000));
    } else {
        localTime = new Date(utcTime);
    }
    
    const hourTime = localTime.getHours();
    return hourTime.toString().padStart(2, '0') + ':00';
}

// Color utilities for theming
export function darkenColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

// Location utilities
export function isInFinlandRegion(lat, lon) {
    return lat >= CONFIG.FINLAND_BOUNDS.LAT_MIN && 
           lat <= CONFIG.FINLAND_BOUNDS.LAT_MAX && 
           lon >= CONFIG.FINLAND_BOUNDS.LON_MIN && 
           lon <= CONFIG.FINLAND_BOUNDS.LON_MAX;
}

// Validation utilities
export function isValidCoordinate(lat, lon) {
    return typeof lat === 'number' && typeof lon === 'number' && 
           !isNaN(lat) && !isNaN(lon) &&
           lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function isValidTemperature(temp) {
    return typeof temp === 'number' && !isNaN(temp);
}

// Storage utilities
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key ${key}:`, error);
        return defaultValue;
    }
}

export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving to localStorage for key ${key}:`, error);
    }
}

// Error handling utilities
export function handleApiError(error, context = '') {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    
    if (error.status === 401) {
        return 'Invalid API key. Please check your configuration.';
    } else if (error.status === 404) {
        return 'Data not found. Please try a different location.';
    } else if (error.status === 429) {
        return 'API rate limit exceeded. Please try again later.';
    } else if (error.status >= 500) {
        return 'Server error. Please try again later.';
    } else {
        return error.message || 'An unexpected error occurred.';
    }
}
