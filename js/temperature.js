// Temperature unit management

import { CONFIG } from './config.js';
import { getFromStorage, saveToStorage } from './utils.js';

// Temperature Unit Management
export function getTempUnit() {
    return getFromStorage('temperatureUnit', CONFIG.DEFAULT_TEMP_UNIT);
}

export function saveTempUnit(unit) {
    saveToStorage('temperatureUnit', unit);
}

export function updateTempUnitDisplay(currentTempUnit) {
    const tempUnitBtn = document.getElementById('tempUnitBtn');
    if (!tempUnitBtn) return;
    
    const symbol = getTempSymbol(currentTempUnit);
    tempUnitBtn.textContent = `🌡️ ${symbol}`;
    
    // Update active state in dropdown
    const tempItems = document.querySelectorAll('.temp-unit-item');
    tempItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.unit === currentTempUnit) {
            item.classList.add('active');
        }
    });
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

export function toggleTempUnitDropdown() {
    const dropdown = document.getElementById('tempUnitDropdown');
    const btn = document.getElementById('tempUnitBtn');
    
    if (!dropdown || !btn) return;
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        btn.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        btn.classList.add('active');
        updateTempUnitDisplay(getTempUnit());
    }
}

export function selectTempUnit(unit, onUnitChange) {
    saveTempUnit(unit);
    updateTempUnitDisplay(unit);
    toggleTempUnitDropdown();
    
    // Notify about unit change
    if (onUnitChange) {
        onUnitChange(unit);
    }
}

// Close dropdown when clicking outside
export function setupTempUnitDropdownListeners(onUnitChange) {
    // Add event listeners for temperature unit selection
    document.querySelectorAll('.temp-unit-item').forEach(item => {
        item.addEventListener('click', function() {
            selectTempUnit(this.dataset.unit, onUnitChange);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('tempUnitDropdown');
        const btn = document.getElementById('tempUnitBtn');
        
        if (dropdown && btn && 
            !btn.contains(event.target) && 
            !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
            btn.classList.remove('active');
        }
    });
}
