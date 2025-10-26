// FMI API integration for Finnish weather data

import { CONFIG } from './config.js';
import { handleApiError } from './utils.js';

// FMI API Functions
export async function fetchFMIData(lat, lon) {
    try {
        // Calculate time window - round to full UTC hours
        const now = new Date();
        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
        const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
        
        const url = `${CONFIG.FMI_BASE_URL}?service=WFS&version=2.0.0&request=GetFeature` +
            `&storedquery_id=fmi::forecast::harmonie::surface::point::timevaluepair` +
            `&latlon=${lat},${lon}` +
            `&timestep=60` +
            `&parameters=temperature,precipitation1h` +
            `&starttime=${startTime.toISOString()}` +
            `&endtime=${endTime.toISOString()}`;
        
        console.log('🌡️ Fetching FMI data from:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`FMI API error: ${response.status}`);
        }
        
        const xmlText = await response.text();
        console.log('🌡️ FMI XML response received');
        
        return xmlText;
    } catch (error) {
        console.error('Error fetching FMI data:', error);
        throw error;
    }
}

export function parseFMIXML(xmlText) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML parsing error: ' + parseError.textContent);
        }
        
        // Try different approaches to find MeasurementTVP elements
        let measurementTVPs = xmlDoc.querySelectorAll('wml2\\:MeasurementTVP');
        
        // If that doesn't work, try without namespace
        if (measurementTVPs.length === 0) {
            measurementTVPs = xmlDoc.querySelectorAll('MeasurementTVP');
        }
        
        console.log(`🌡️ Found ${measurementTVPs.length} MeasurementTVP elements`);
        
        if (measurementTVPs.length === 0) {
            console.log('🌡️ No MeasurementTVP elements found, checking for other data structures...');
            
            // Check for other possible data structures
            const observations = xmlDoc.querySelectorAll('omso\\:PointTimeSeriesObservation, PointTimeSeriesObservation');
            const measurements = xmlDoc.querySelectorAll('wml2\\:MeasurementTimeseries, MeasurementTimeseries');
            const results = xmlDoc.querySelectorAll('om\\:result, result');
            
            console.log(`🌡️ Found: ${observations.length} observations, ${measurements.length} measurements, ${results.length} results`);
            
            throw new Error('No MeasurementTVP data found in FMI response');
        }
        
        // Parse temperature and precipitation data from separate members
        const temperatureData = [];
        const precipitationData = [];
        
        // Get all wfs:member elements (one for temperature, one for precipitation)
        let members = xmlDoc.querySelectorAll('wfs\\:member');
        
        // Try without namespace if needed
        if (members.length === 0) {
            members = xmlDoc.querySelectorAll('member');
        }
        
        console.log(`🌡️ Found ${members.length} member elements`);
        
        members.forEach((member, index) => {
            // Check if this member contains temperature or precipitation data
            let observedProperty = member.querySelector('om\\:observedProperty');
            if (!observedProperty) {
                observedProperty = member.querySelector('observedProperty');
            }
            
            const href = observedProperty ? observedProperty.getAttribute('xlink:href') : '';
            
            console.log(`🌡️ Member ${index} observedProperty href:`, href);
            
            // Get all MeasurementTVP elements in this member using multiple approaches
            let memberTVPs = member.querySelectorAll('wml2\\:MeasurementTVP');
            if (memberTVPs.length === 0) {
                memberTVPs = member.querySelectorAll('MeasurementTVP');
            }
            
            console.log(`🌡️ Member ${index} has ${memberTVPs.length} MeasurementTVP elements`);
            
            memberTVPs.forEach(tvp => {
                // Try different approaches to get time and value
                let timeElement = tvp.querySelector('wml2\\:time');
                if (!timeElement) {
                    timeElement = tvp.querySelector('time');
                }
                
                let valueElement = tvp.querySelector('wml2\\:value');
                if (!valueElement) {
                    valueElement = tvp.querySelector('value');
                }
                
                if (timeElement && valueElement) {
                    const time = timeElement.textContent.trim();
                    const value = parseFloat(valueElement.textContent.trim());
                    
                    console.log(`🌡️ Processing: time=${time}, value=${value}, href=${href}`);
                    
                    // Determine data type based on observedProperty href
                    if (href.includes('temperature')) {
                        temperatureData.push({ time, value });
                    } else if (href.includes('precipitation1h')) {
                        precipitationData.push({ time, value });
                    }
                }
            });
        });
        
        console.log(`🌡️ Parsed ${temperatureData.length} temperature values and ${precipitationData.length} precipitation values`);
        
        return { temperatureData, precipitationData };
    } catch (error) {
        console.error('Error parsing FMI XML:', error);
        throw error;
    }
}

export function combineFMIData(temperatureData, precipitationData) {
    const combinedData = [];
    
    // Create a map for quick lookup
    const tempMap = new Map();
    const precipMap = new Map();
    
    temperatureData.forEach(item => {
        tempMap.set(item.time, item.value);
    });
    
    precipitationData.forEach(item => {
        precipMap.set(item.time, item.value);
    });
    
    // Get all unique timestamps
    const allTimes = new Set([...tempMap.keys(), ...precipMap.keys()]);
    const sortedTimes = Array.from(allTimes).sort();
    
    // Combine data for each timestamp
    sortedTimes.forEach(time => {
        const tempValue = tempMap.get(time) || 0;
        const precipValue = precipMap.get(time) || 0;
        
        combinedData.push({
            dt: new Date(time).getTime() / 1000, // Convert to Unix timestamp
            temp: tempValue,
            rain: { "1h": precipValue }
        });
    });
    
    // Sort by timestamp and take first 24 hours
    combinedData.sort((a, b) => a.dt - b.dt);
    
    console.log(`🌡️ Combined ${combinedData.length} data points`);
    
    return combinedData.slice(0, 24);
}

export async function getWeatherFromFMI(lat, lon) {
    try {
        const xmlText = await fetchFMIData(lat, lon);
        const { temperatureData, precipitationData } = parseFMIXML(xmlText);
        const hourlyData = combineFMIData(temperatureData, precipitationData);
        
        if (hourlyData.length === 0) {
            throw new Error('No valid weather data received from FMI');
        }
        
        console.log(`🌡️ Successfully processed ${hourlyData.length} hours of FMI data`);
        
        return hourlyData;
    } catch (error) {
        console.error('Error getting weather from FMI:', error);
        throw error;
    }
}
