// Main entry point for the weather app
// This file coordinates all the modules and initializes the application

import { initializeWeatherApp } from './weather-api.js';

// Define global image handler functions immediately
window.handleImageError = function(img, title) {
    img.parentElement.innerHTML = '<div class="no-image">No preview available</div>';
};

window.handleImageLoad = function(img, title) {
    // Could add loading animation removal here if needed
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌤️ Initializing Weather App...');
    initializeWeatherApp();
});
