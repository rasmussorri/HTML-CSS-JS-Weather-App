// Favorites management functionality

import { getFromStorage, saveToStorage } from './utils.js';

// Favorites Management
export function getFavorites() {
    return getFromStorage('weatherFavorites', []);
}

export function saveFavorites(favorites) {
    saveToStorage('weatherFavorites', favorites);
}

export function addToFavorites(locationData) {
    const favorites = getFavorites();
    
    // Check if already exists
    const exists = favorites.some(fav => 
        fav.name === locationData.name && 
        fav.coord.lat === locationData.coord.lat && 
        fav.coord.lon === locationData.coord.lon
    );
    
    if (!exists) {
        const favoriteItem = {
            name: locationData.name,
            coord: locationData.coord,
            addedAt: new Date().toISOString()
        };
        favorites.push(favoriteItem);
        saveFavorites(favorites);
        return true;
    }
    return false;
}

export function removeFromFavorites(locationData) {
    const favorites = getFavorites();
    const filteredFavorites = favorites.filter(fav => 
        !(fav.name === locationData.name && 
          fav.coord.lat === locationData.coord.lat && 
          fav.coord.lon === locationData.coord.lon)
    );
    saveFavorites(filteredFavorites);
}

export function clearAllFavorites() {
    if (confirm('Are you sure you want to clear all favorites?')) {
        saveFavorites([]);
    }
}

export function isLocationInFavorites(locationData, favorites) {
    if (!locationData) return false;
    return favorites.some(fav => 
        fav.name === locationData.name && 
        fav.coord.lat === locationData.coord.lat && 
        fav.coord.lon === locationData.coord.lon
    );
}

export function updateFavoritesDisplay() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    
    const favorites = getFavorites();
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="no-favorites">No favorites saved yet</div>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(fav => `
        <div class="favorite-item">
            <div class="favorite-info">
                <div class="favorite-name">${fav.name}</div>
                <div class="favorite-coords">${fav.coord.lat.toFixed(4)}, ${fav.coord.lon.toFixed(4)}</div>
            </div>
            <div class="favorite-actions">
                <button class="favorite-search-btn" onclick="window.searchFavoriteLocation('${fav.name}', ${fav.coord.lat}, ${fav.coord.lon})">Search</button>
                <button class="favorite-remove-btn" onclick="window.removeFavoriteLocation('${fav.name}', ${fav.coord.lat}, ${fav.coord.lon})">Remove</button>
            </div>
        </div>
    `).join('');
}

export function updateAddToFavoritesButton(currentLocationData) {
    const addBtn = document.getElementById('addToFavoritesBtn');
    if (!addBtn) return;
    
    if (currentLocationData) {
        addBtn.style.display = 'inline-block';
        const favorites = getFavorites();
        if (isLocationInFavorites(currentLocationData, favorites)) {
            addBtn.textContent = '⭐ Added to Favorites';
            addBtn.classList.add('added');
        } else {
            addBtn.textContent = '⭐ Add to Favorites';
            addBtn.classList.remove('added');
        }
    } else {
        addBtn.style.display = 'none';
    }
}

export function toggleFavoritesDropdown() {
    const dropdown = document.getElementById('favoritesDropdown');
    const btn = document.getElementById('favoritesBtn');
    
    if (!dropdown || !btn) return;
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        btn.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        btn.classList.add('active');
        updateFavoritesDisplay();
    }
}

// Global functions for onclick handlers
window.searchFavoriteLocation = function(name, lat, lon) {
    // Set the input value
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = name;
    }
    
    // Close the dropdown
    toggleFavoritesDropdown();
    
    // Search for the location using coordinates
    if (window.getWeatherByCoords) {
        window.getWeatherByCoords(lat, lon);
    }
};

window.removeFavoriteLocation = function(name, lat, lon) {
    const locationData = {
        name: name,
        coord: { lat: lat, lon: lon }
    };
    removeFromFavorites(locationData);
    updateFavoritesDisplay();
    // Update the add button if we're currently viewing this location
    if (window.currentLocationData && 
        window.currentLocationData.name === name &&
        window.currentLocationData.coord.lat === lat &&
        window.currentLocationData.coord.lon === lon) {
        updateAddToFavoritesButton(window.currentLocationData);
    }
};
