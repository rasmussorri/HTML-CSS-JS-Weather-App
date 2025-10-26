// Weather chart functionality using Frappe Charts

import { CONFIG } from './config.js';
import { convertTemperature, getTempSymbol, formatTime24Hour } from './utils.js';

// Weather Chart Functions using Frappe Charts
export function displayWeatherChart(hourlyData, fullData = null, currentTempUnit, currentTimezoneOffset) {
    const chartContainer = document.getElementById('forecastChart');
    const chartElement = document.getElementById('weatherChart');
    
    if (!chartElement || !chartContainer) {
        console.error('Chart elements not found');
        return;
    }
    
    // Show the chart container
    chartContainer.style.display = 'block';
    
    // Create chart immediately without delay to avoid race conditions
    try {
        createChart(hourlyData, chartElement, fullData, currentTempUnit, currentTimezoneOffset);
    } catch (error) {
        console.error('Error creating chart:', error);
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">Chart unavailable</p>';
    }
}

export function createChart(hourlyData, chartElement, fullData = null, currentTempUnit, currentTimezoneOffset) {
    // Check if Frappe Chart library is loaded
    if (typeof frappe === 'undefined' || !frappe.Chart) {
        console.error('Frappe Chart library not loaded');
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">Chart library not available</p>';
        return;
    }
    
    // Ensure the element is ready - let Frappe Chart handle its own DOM management
    chartElement.style.display = 'block';
    chartElement.style.width = '100%';
    chartElement.style.height = 'auto';
    
    // Take first 24 hours
    const next24Hours = hourlyData.slice(0, 24);
    
    // Validate data
    if (!next24Hours || next24Hours.length === 0) {
        console.error('No hourly data available for chart');
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">No data available</p>';
        return;
    }
    
    // Debug: Log the data structure
    console.log('📊 Chart data sample:', next24Hours[0]);
    
    // Prepare data with validation
    const temperatures = next24Hours.map(hour => {
        const tempCelsius = hour.temp;
        if (typeof tempCelsius !== 'number' || isNaN(tempCelsius)) {
            console.warn('Invalid temperature data:', tempCelsius);
            return 0;
        }
        // Convert to selected unit for chart display
        const convertedTemp = convertTemperature(tempCelsius, currentTempUnit);
        return Math.round(convertedTemp * 10) / 10; // Keep one decimal place
    });
    
    const times = next24Hours.map((hour, index) => {
        if (!hour.dt) {
            console.warn('Missing timestamp for hour:', index);
            return `${index}:00`;
        }
        
        return formatTime24Hour(hour.dt, currentTimezoneOffset);
    });
    
    // Prepare comparison data if available
    let comparisonTemperatures = null;
    let comparisonRainVolume = null;
    
    if (fullData && fullData.multiSource && fullData.fmiData && fullData.openWeatherData) {
        console.log('📊 Preparing comparison data for chart');
        
        // Determine which is primary and which is comparison
        let primaryData, comparisonData;
        if (fullData.dataSource === 'FMI') {
            primaryData = fullData.fmiData;
            comparisonData = fullData.openWeatherData;
        } else {
            primaryData = fullData.openWeatherData;
            comparisonData = fullData.fmiData;
        }
        
        // Prepare comparison temperature data
        comparisonTemperatures = comparisonData.slice(0, 24).map(hour => {
            const tempCelsius = hour.temp;
            if (typeof tempCelsius !== 'number' || isNaN(tempCelsius)) {
                return 0;
            }
            // Convert to selected unit for chart display
            const convertedTemp = convertTemperature(tempCelsius, currentTempUnit);
            return Math.round(convertedTemp * 10) / 10; // Keep one decimal place
        });
        
        // Prepare comparison rain data
        comparisonRainVolume = comparisonData.slice(0, 24).map(hour => {
            const rain = hour.rain?.['1h'];
            if (typeof rain !== 'number' || isNaN(rain)) {
                return 0;
            }
            return rain;
        });
    }
    
    // Calculate dynamic y-axis range based on temperature data and unit
    const allTemps = comparisonTemperatures ? [...temperatures, ...comparisonTemperatures] : temperatures;
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);
    const tempRange = maxTemp - minTemp;
    
    // Simplified y-axis calculation based on temperature range
    let yAxisMin, yAxisMax;
    
    if (tempRange < 5) {
        yAxisMax = maxTemp + 2;
        yAxisMin = minTemp - 2;
    } else if (tempRange <= 10) {
        yAxisMax = maxTemp + 5;
        yAxisMin = minTemp - 5;
    } else {
        yAxisMax = maxTemp + 10;
        yAxisMin = minTemp - 10;
    }
    
    const finalMin = yAxisMin;
    const finalMax = yAxisMax;
    
    const tempSymbol = getTempSymbol(currentTempUnit);
    console.log(`🌡️ Temperature range: ${minTemp}${tempSymbol} to ${maxTemp}${tempSymbol}`);
    console.log(`📊 Y-axis range: ${finalMin}${tempSymbol} to ${finalMax}${tempSymbol}`);
    
    // Process rain volume
    const rainVolume = next24Hours.map(hour => {
        const rain = hour.rain?.['1h'];
        if (typeof rain !== 'number' || isNaN(rain)) {
            return 0;
        }
        return rain;
    });
    
    console.log(`🌧️ Rain volume processed with actual values for secondary y-axis`);
    
    // Process comparison rain data with actual values if available
    if (comparisonRainVolume) {
        comparisonRainVolume = comparisonRainVolume.map(rain => {
            if (typeof rain !== 'number' || isNaN(rain)) {
                return 0;
            }
            return rain;
        });
        console.log(`🌧️ Comparison rain volume processed with actual values for secondary y-axis`);
    }
    
    // Generate dynamic yMarkers based on the calculated range
    const dynamicYMarkers = [];
    
    // Calculate appropriate interval based on range
    const range = finalMax - finalMin;
    let interval;
    if (range <= 10) {
        interval = 1;
    } else if (range <= 30) {
        interval = 2;
    } else if (range <= 60) {
        interval = 5;
    } else {
        interval = 10;
    }
    
    // Generate markers at calculated intervals
    for (let temp = finalMin; temp <= finalMax; temp += interval) {
        dynamicYMarkers.push({
            label: "",
            value: temp,
            options: { lineType: "dashed", color: "rgba(0,0,0,0.1)" }
        });
    }
    
    console.log(`📏 Generated ${dynamicYMarkers.length} yMarkers at ${interval}${tempSymbol} intervals: ${finalMin}${tempSymbol} to ${finalMax}${tempSymbol}`);
    
    // Add solid line at appropriate reference temperature
    let referenceTemp, referenceLabel;
    
    if (currentTempUnit === CONFIG.TEMP_UNITS.CELSIUS) {
        referenceTemp = 0;
        referenceLabel = "0°C";
    } else if (currentTempUnit === CONFIG.TEMP_UNITS.FAHRENHEIT) {
        referenceTemp = 32;
        referenceLabel = "32F";
    } else if (currentTempUnit === CONFIG.TEMP_UNITS.KELVIN) {
        referenceTemp = 273.15;
        referenceLabel = "273.15K";
    }
    
    // Add solid line at reference temperature if it's within the temperature range
    if (finalMin <= referenceTemp && finalMax >= referenceTemp) {
        dynamicYMarkers.push({
            label: referenceLabel,
            value: referenceTemp,
            options: { lineType: "solid", color: "rgba(0,0,0,0.8)", lineWidth: 2 }
        });
        console.log(`📏 Added solid line at ${referenceLabel}`);
    }
    
    // Validate chart data before creating chart
    if (temperatures.length === 0 || times.length === 0) {
        console.error('Invalid chart data: empty arrays');
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">Invalid chart data</p>';
        return;
    }
    
    // Ensure all arrays have the same length
    const minLength = Math.min(temperatures.length, rainVolume.length, times.length);
    
    if (minLength === 0) {
        console.error('Invalid chart data: no valid data points');
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">No valid data points</p>';
        return;
    }
    
    // Truncate arrays to same length
    const validTemperatures = temperatures.slice(0, minLength);
    const validRainVolume = rainVolume.slice(0, minLength);
    const validTimes = times.slice(0, minLength);
    
    // Create Frappe Charts data structure
    const chartData = {
        labels: validTimes,
        datasets: [
            {
                name: `OW Temp (${tempSymbol})`,
                type: "line",
                values: validTemperatures,
                yAxisIndex: 0
            },
            {
                name: "OW Rain (mm)",
                type: "bar",
                values: validRainVolume,
                yAxisIndex: 1,
                chartType: "bar",
                renderAs: "bar"
            }
        ],
        yMarkers: dynamicYMarkers
    };
    
    // Add comparison data if available
    if (comparisonTemperatures) {
        const validComparisonTemps = comparisonTemperatures.slice(0, minLength);
        const validComparisonRain = comparisonRainVolume.slice(0, minLength);
        
        chartData.datasets.push({
            name: `FMI Temp (${tempSymbol})`,
            type: "line",
            values: validComparisonTemps,
            yAxisIndex: 0
        });
        
        chartData.datasets.push({
            name: "FMI Rain (mm)",
            type: "bar",
            values: validComparisonRain,
            yAxisIndex: 1,
            chartType: "bar",
            renderAs: "bar"
        });
    }
    
    console.log('📊 Chart data structure:', chartData);
    
    // Determine responsive chart height
    const isMobile = window.innerWidth <= 1023;
    const isSmallMobile = window.innerWidth <= 480;
    const chartHeight = isSmallMobile ? CONFIG.CHART_HEIGHTS.MOBILE : 
                       (isMobile ? CONFIG.CHART_HEIGHTS.TABLET : CONFIG.CHART_HEIGHTS.DESKTOP);
    
    // Create the chart with enhanced styling
    try {
        new frappe.Chart("#weatherChart", {
            title: comparisonTemperatures ? `Temperature & Rain Forecast (Multi-Source) - ${tempSymbol}` : `Temperature & Rain Forecast - ${tempSymbol}`,
            data: chartData,
            type: 'axis-mixed',
            height: chartHeight,
            colors: ['#ff0000', '#87ceeb', '#ff8c00', '#0000ff'],
            animate: true,
            axisOptions: {
                xAxisMode: 'tick',
                yAxisMode: 'tick',
                xIsSeries: true,
                yAxisMin: finalMin,
                yAxisMax: finalMax,
                yAxisMin2: 0,
                yAxisMax2: Math.max(...rainVolume, ...(comparisonRainVolume || [])),
                barAxisIndex: 1,
                xAxisMargin: 30,
                yAxisMargin: 20
            },
            gridOptions: {
                showHorizontalLines: true,
                showVerticalLines: false
            },
            barOptions: {
                spaceRatio: 0.3,
                height: 35,
                stacked: false,
                showValues: true,
                barWidth: 15,
                forceBar: true
            },
            lineOptions: {
                dotSize: 0,
                hideDots: 1,
                heatline: false,
                regionFill: 0,
                spline: 0
            },
            tooltipOptions: {
                formatTooltipX: d => d,
                formatTooltipY: d => {
                    const isTemp = chartData.datasets.some(dataset => 
                        dataset.type === 'line' && dataset.values.includes(d)
                    );
                    
                    if (isTemp) {
                        return d + tempSymbol;
                    } else {
                        return d.toFixed(1) + 'mm';
                    }
                }
            },
            valuesOverPoints: 0,
            isNavigable: true,
            showLegend: 1,
            showDots: 0,
            showTooltip: 1,
            showValues: 0
        });
        
        console.log('📊 Chart created successfully');
        
    } catch (chartError) {
        console.error('Frappe Chart creation failed:', chartError);
        chartElement.innerHTML = '<p style="text-align: center; color: #666;">Chart rendering failed</p>';
        return;
    }
}
