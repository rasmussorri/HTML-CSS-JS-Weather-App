// API usage tracking and management

import { CONFIG } from './config.js';
import { getFromStorage, saveToStorage } from './utils.js';

// API Usage Tracking
export function getApiUsage() {
    const today = new Date().toDateString();
    const usage = getFromStorage('apiUsage', {});
    return usage[today] || 0;
}

export function getWindyApiUsage() {
    const today = new Date().toDateString();
    const usage = getFromStorage('windyApiUsage', {});
    return usage[today] || 0;
}

export function incrementApiUsage() {
    const today = new Date().toDateString();
    const usage = getFromStorage('apiUsage', {});
    usage[today] = (usage[today] || 0) + 1;
    saveToStorage('apiUsage', usage);
}

export function incrementWindyApiUsage() {
    const today = new Date().toDateString();
    const usage = getFromStorage('windyApiUsage', {});
    usage[today] = (usage[today] || 0) + 1;
    saveToStorage('windyApiUsage', usage);
}

export function checkApiLimit() {
    const usage = getApiUsage();
    if (usage >= CONFIG.WEATHER_API_WARNING) {
        console.warn(`API limit warning: ${usage}/${CONFIG.WEATHER_API_LIMIT} calls used today`);
        return false;
    }
    return true;
}

export function checkWindyApiLimit() {
    const usage = getWindyApiUsage();
    if (usage >= CONFIG.WINDY_API_WARNING) {
        console.warn(`WindyWebcams API limit warning: ${usage}/${CONFIG.WINDY_API_LIMIT} calls used today`);
        return false;
    }
    if (usage >= CONFIG.WINDY_API_LIMIT) {
        console.error('WindyWebcams API limit reached: 500/500 calls used today');
        return false;
    }
    return true;
}

export function updateUsageDisplay() {
    const weatherUsage = getApiUsage();
    const windyUsage = getWindyApiUsage();
    const usageInfo = document.getElementById('usageInfo');
    
    if (!usageInfo) return;
    
    usageInfo.innerHTML = `
        <div>Weather API: ${weatherUsage}/${CONFIG.WEATHER_API_LIMIT}</div>
        <div>WindyWebcams API: ${windyUsage}/${CONFIG.WINDY_API_LIMIT}</div>
    `;
    
    // Color coding for warnings
    if (weatherUsage >= 800 || windyUsage >= 400) {
        usageInfo.style.background = '#ffe6e6';
        usageInfo.style.color = '#d63031';
    } else if (weatherUsage >= 500 || windyUsage >= 250) {
        usageInfo.style.background = '#fff3cd';
        usageInfo.style.color = '#856404';
    }
}
