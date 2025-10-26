// WindyWebcams API integration

import { CONFIG, WINDY_API_KEY } from './config.js';
import { checkWindyApiLimit, incrementWindyApiUsage, updateUsageDisplay } from './api-usage.js';
import { handleApiError } from './utils.js';

// WindyWebcams API functions
export async function fetchWebcams(lat, lon, radiusKm = CONFIG.DEFAULT_WEBCAM_RADIUS) {
    if (!WINDY_API_KEY) {
        console.error('WindyWebcams API key not loaded');
        return null;
    }

    // Check WindyWebcams API limit
    if (!checkWindyApiLimit()) {
        return null;
    }

    try {
        const url = `${CONFIG.WINDY_BASE_URL}/webcams?nearby=${lat},${lon},${radiusKm}&include=images,location,player,urls&limit=6`;
        
        const response = await fetch(url, {
            headers: {
                'X-WINDY-API-KEY': WINDY_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`WindyWebcams API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Increment WindyWebcams API usage
        incrementWindyApiUsage();
        updateUsageDisplay();
        
        return data;
    } catch (error) {
        console.error('Error fetching webcams:', error);
        return null;
    }
}

export function displayWebcams(webcamData) {
    const webcamContainer = document.getElementById('webcamContainer');
    if (!webcamContainer) {
        console.error('🎥 Webcam container not found');
        return;
    }

    if (!webcamData || !webcamData.webcams || webcamData.webcams.length === 0) {
        webcamContainer.innerHTML = '<p>No webcams available in this area.</p>';
        webcamContainer.style.display = 'block';
        return;
    }

    const webcams = webcamData.webcams;
    let webcamHTML = '<h3>Live Webcams</h3><div class="webcam-grid">';

    webcams.forEach(webcam => {
        const title = webcam.title || 'Webcam';
        const location = webcam.location ? `${webcam.location.city}, ${webcam.location.country}` : 'Unknown location';
        
        // Get the best available image URL
        const imageUrl = webcam.images?.current?.preview || 
                        webcam.images?.daylight?.preview || 
                        webcam.urls?.provider || 
                        '';
        
        const playerUrl = webcam.player?.day || 
                         webcam.player?.lifetime || 
                         '';

        webcamHTML += `
            <div class="webcam-item">
                <div class="webcam-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" loading="lazy" onerror="handleImageError(this, '${title}')" onload="handleImageLoad(this, '${title}')">` : '<div class="no-image">No preview available</div>'}
                </div>
                <div class="webcam-info">
                    <h4>${title}</h4>
                    <p class="webcam-location">${location}</p>
                    <p class="webcam-status">Status: ${webcam.status || 'Unknown'}</p>
                    <p class="webcam-views">Views: ${webcam.viewCount ? webcam.viewCount.toLocaleString() : 'Unknown'}</p>
                    ${playerUrl ? `<a href="${playerUrl}" target="_blank" class="webcam-link">View Live Stream</a>` : ''}
                </div>
            </div>
        `;
    });

    webcamHTML += '</div>';
    webcamContainer.innerHTML = webcamHTML;
    webcamContainer.style.display = 'block';
}

// Local loading functions to avoid circular dependency
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

export async function loadWebcamsForLocation(lat, lon) {
    showLoading();
    
    try {
        const webcamData = await fetchWebcams(lat, lon);
        displayWebcams(webcamData);
    } catch (error) {
        console.error('Error loading webcams:', error);
        const webcamContainer = document.getElementById('webcamContainer');
        if (webcamContainer) {
            webcamContainer.innerHTML = '<p>Unable to load webcams at this time.</p>';
            webcamContainer.style.display = 'block';
        }
    } finally {
        hideLoading();
    }
}

// Image error handler
export function handleImageError(img, title) {
    img.parentElement.innerHTML = '<div class="no-image">No preview available</div>';
}

// Image load handler
export function handleImageLoad(img, title) {
    // Could add loading animation removal here if needed
}

// Note: Global functions handleImageError and handleImageLoad are defined in main.js
