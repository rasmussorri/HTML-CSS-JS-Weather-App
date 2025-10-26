// Weather theming system

import { darkenColor } from './utils.js';

// Dynamic Weather Theming System
export function applyWeatherTheme(weatherData) {
    const temp = weatherData.temp;
    const weatherId = weatherData.weather[0].id;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const currentHour = new Date().getHours();
    
    // Determine theme based on multiple factors
    const theme = determineWeatherTheme(temp, weatherId, weatherMain, currentHour);
    
    // Apply the theme to the body
    applyThemeToBody(theme);
}

export function determineWeatherTheme(temp, weatherId, weatherMain, currentHour) {
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

export function applyThemeToBody(theme) {
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

export function getThemeColors(temp, weather, time) {
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

// Test random theme function
export function testRandomTheme() {
    const themes = [
        { temp: 'cold', weather: 'snowy', time: 'night' },
        { temp: 'warm', weather: 'sunny', time: 'day' },
        { temp: 'hot', weather: 'sunny', time: 'day' },
        { temp: 'cool', weather: 'rainy', time: 'day' },
        { temp: 'freezing', weather: 'snowy', time: 'night' },
        { temp: 'warm', weather: 'cloudy', time: 'day' },
        { temp: 'cold', weather: 'stormy', time: 'night' },
        { temp: 'hot', weather: 'clear', time: 'day' }
    ];
    
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const theme = {
        temp: randomTheme.temp,
        weather: randomTheme.weather,
        time: randomTheme.time,
        combined: `${randomTheme.temp}-${randomTheme.weather}-${randomTheme.time}`
    };
    
    applyThemeToBody(theme);
    console.log('🎨 Applied random theme:', theme);
}
