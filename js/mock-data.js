// Mock Data System for Theme Testing
// This file contains mock weather data and testing functions for development

const mockWeatherData = [
    // Freezing conditions
    { temp: -5, weather: [{ main: 'Snow', description: 'heavy snow', id: 602 }], humidity: 85, wind_speed: 8 },
    { temp: -2, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 70, wind_speed: 5 },
    
    // Cold conditions
    { temp: 3, weather: [{ main: 'Rain', description: 'light rain', id: 500 }], humidity: 90, wind_speed: 12 },
    { temp: 8, weather: [{ main: 'Clouds', description: 'overcast clouds', id: 804 }], humidity: 75, wind_speed: 6 },
    
    // Cool conditions
    { temp: 12, weather: [{ main: 'Mist', description: 'mist', id: 701 }], humidity: 95, wind_speed: 3 },
    { temp: 15, weather: [{ main: 'Clouds', description: 'few clouds', id: 801 }], humidity: 60, wind_speed: 7 },
    
    // Warm conditions
    { temp: 22, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 45, wind_speed: 4 },
    { temp: 25, weather: [{ main: 'Clouds', description: 'scattered clouds', id: 802 }], humidity: 55, wind_speed: 6 },
    
    // Hot conditions
    { temp: 32, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 30, wind_speed: 2 },
    { temp: 35, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 25, wind_speed: 1 },
    
    // Stormy conditions
    { temp: 18, weather: [{ main: 'Thunderstorm', description: 'thunderstorm with heavy rain', id: 211 }], humidity: 85, wind_speed: 25 },
    { temp: 20, weather: [{ main: 'Thunderstorm', description: 'thunderstorm with light rain', id: 200 }], humidity: 80, wind_speed: 15 },
    
    // Foggy conditions
    { temp: 10, weather: [{ main: 'Fog', description: 'fog', id: 741 }], humidity: 100, wind_speed: 1 },
    { temp: 14, weather: [{ main: 'Mist', description: 'mist', id: 701 }], humidity: 95, wind_speed: 2 },
    
    // Rainy conditions
    { temp: 16, weather: [{ main: 'Rain', description: 'moderate rain', id: 501 }], humidity: 90, wind_speed: 10 },
    { temp: 19, weather: [{ main: 'Drizzle', description: 'light intensity drizzle', id: 300 }], humidity: 85, wind_speed: 8 }
];

const mockCities = [
    'Helsinki', 'London', 'Tokyo', 'New York', 'Paris', 'Sydney', 'Moscow', 'Dubai', 
    'Reykjavik', 'Bangkok', 'Mumbai', 'Cairo', 'Rio de Janeiro', 'Toronto', 'Berlin'
];

const mockTimes = [
    { hour: 6, label: '6:00 AM - Dawn' },
    { hour: 9, label: '9:00 AM - Morning' },
    { hour: 12, label: '12:00 PM - Noon' },
    { hour: 15, label: '3:00 PM - Afternoon' },
    { hour: 18, label: '6:00 PM - Evening' },
    { hour: 21, label: '9:00 PM - Night' },
    { hour: 0, label: '12:00 AM - Midnight' },
    { hour: 3, label: '3:00 AM - Late Night' }
];

function getRandomMockData() {
    const randomWeather = mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
    const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
    const randomTime = mockTimes[Math.floor(Math.random() * mockTimes.length)];
    
    // Create mock hourly data with varied weather
    const mockHourly = [];
    const weatherVariations = [
        { main: 'Clear', description: 'clear sky', icon: '01d' },
        { main: 'Clouds', description: 'few clouds', icon: '02d' },
        { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
        { main: 'Clouds', description: 'broken clouds', icon: '04d' },
        { main: 'Rain', description: 'light rain', icon: '10d' },
        { main: 'Rain', description: 'moderate rain', icon: '10d' },
        { main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
        { main: 'Snow', description: 'light snow', icon: '13d' },
        { main: 'Mist', description: 'mist', icon: '50d' }
    ];
    
    for (let i = 0; i < 24; i++) {
        const hourTemp = randomWeather.temp + (Math.random() - 0.5) * 6;
        const hourPop = Math.floor(Math.random() * 100);
        const randomWeatherVariation = weatherVariations[Math.floor(Math.random() * weatherVariations.length)];
        
        mockHourly.push({
            dt: Date.now() / 1000 + (i * 3600),
            temp: hourTemp,
            pop: hourPop / 100,
            weather: [randomWeatherVariation]
        });
    }
    
    // Create mock daily data with varied weather
    const mockDaily = [];
    for (let i = 0; i < 7; i++) {
        const dayTemp = randomWeather.temp + (Math.random() - 0.5) * 8;
        const dayMin = dayTemp - Math.random() * 5;
        const dayMax = dayTemp + Math.random() * 5;
        const randomWeatherVariation = weatherVariations[Math.floor(Math.random() * weatherVariations.length)];
        
        mockDaily.push({
            dt: Date.now() / 1000 + (i * 86400),
            temp: { min: dayMin, max: dayMax },
            weather: [randomWeatherVariation]
        });
    }
    
    return {
        name: randomCity,
        current: {
            temp: randomWeather.temp,
            humidity: randomWeather.humidity,
            wind_speed: randomWeather.wind_speed,
            weather: randomWeather.weather
        },
        hourly: mockHourly,
        daily: mockDaily,
        mockTime: randomTime
    };
}

function testRandomTheme() {
    const mockData = getRandomMockData();
    
    // Display the mock weather data
    document.getElementById('locationName').textContent = mockData.name;
    document.getElementById('currentTemp').textContent = Math.round(mockData.current.temp);
    document.getElementById('weatherDescription').textContent = mockData.current.weather[0].description;
    document.getElementById('humidity').textContent = mockData.current.humidity;
    document.getElementById('windSpeed').textContent = Math.round(mockData.current.wind_speed * 3.6);
    
    // Display mock time
    displayMockTime(mockData.mockTime);

    // Apply the theme with mock time
    applyWeatherThemeWithMockTime(mockData.current, mockData.mockTime);

    // Show the weather and forecasts
    document.getElementById('weather').style.display = 'block';
    
    if (mockData.hourly) {
        displayForecast(mockData.hourly);
    }
    if (mockData.daily) {
        display7DayForecast(mockData.daily);
    }
    
    // Show a notification about the test
    console.log(`🎨 Testing theme for: ${mockData.name}, ${Math.round(mockData.current.temp)}°C, ${mockData.current.weather[0].description} at ${mockData.mockTime.label}`);
}

// Display mock time instead of real time
function displayMockTime(mockTime) {
    const hours = mockTime.hour.toString().padStart(2, '0');
    const minutes = '00'; // Always show :00 for mock times
    const timeString = `${hours}:${minutes}`;
    
    document.getElementById('timeDisplay').textContent = `${timeString} (${mockTime.label})`;
}

// Apply theme with mock time
function applyWeatherThemeWithMockTime(weatherData, mockTime) {
    const temp = weatherData.temp;
    const weatherId = weatherData.weather[0].id;
    const weatherMain = weatherData.weather[0].main.toLowerCase();
    const mockHour = mockTime.hour;
    
    // Determine theme based on mock time instead of real time
    const theme = determineWeatherThemeWithMockTime(temp, weatherId, weatherMain, mockHour);
    
    // Apply the theme to the body
    applyThemeToBody(theme);
}

// Theme determination with mock time
function determineWeatherThemeWithMockTime(temp, weatherId, weatherMain, mockHour) {
    // Time-based theming using mock time
    const isNight = mockHour < 6 || mockHour > 18;
    
    // Temperature-based theming
    let tempTheme = '';
    if (temp < 0) {
        tempTheme = 'freezing';
    } else if (temp < 10) {
        tempTheme = 'cold';
    } else if (temp < 20) {
        tempTheme = 'cool';
    } else if (temp < 30) {
        tempTheme = 'warm';
    } else {
        tempTheme = 'hot';
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
    
    console.log(`🌡️ Mock theme determination:`, {
        temp: temp,
        weatherMain: weatherMain,
        mockHour: mockHour,
        isNight: isNight,
        tempTheme: tempTheme,
        weatherTheme: weatherTheme
    });
    
    return {
        temp: tempTheme,
        weather: weatherTheme,
        time: isNight ? 'night' : 'day',
        combined: `${tempTheme}-${weatherTheme}-${isNight ? 'night' : 'day'}`
    };
}

// Function to test specific theme combinations
function testSpecificThemes() {
    const testScenarios = [
        { temp: -10, weather: [{ main: 'Snow', description: 'heavy snow', id: 602 }], humidity: 90, wind_speed: 15 }, // Freezing snowy night
        { temp: 35, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 20, wind_speed: 1 }, // Hot sunny day
        { temp: 5, weather: [{ main: 'Rain', description: 'moderate rain', id: 501 }], humidity: 95, wind_speed: 20 }, // Cold rainy night
        { temp: 25, weather: [{ main: 'Thunderstorm', description: 'thunderstorm with heavy rain', id: 211 }], humidity: 85, wind_speed: 30 }, // Warm stormy day
        { temp: 8, weather: [{ main: 'Fog', description: 'fog', id: 741 }], humidity: 100, wind_speed: 1 }, // Cool foggy morning
        { temp: 30, weather: [{ main: 'Clouds', description: 'overcast clouds', id: 804 }], humidity: 60, wind_speed: 8 } // Hot cloudy day
    ];
    
    const randomScenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
    const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
    
    const testData = {
        name: randomCity,
        current: randomScenario,
        hourly: [], // Simplified for testing
        daily: []   // Simplified for testing
    };
    
    // Display the test data
    document.getElementById('locationName').textContent = testData.name;
    document.getElementById('currentTemp').textContent = Math.round(testData.current.temp);
    document.getElementById('weatherDescription').textContent = testData.current.weather[0].description;
    document.getElementById('humidity').textContent = testData.current.humidity;
    document.getElementById('windSpeed').textContent = Math.round(testData.current.wind_speed * 3.6);

    // Apply the theme
    applyWeatherTheme(testData.current);

    // Show the weather
    document.getElementById('weather').style.display = 'block';
    
    console.log(`🎨 Testing specific theme: ${testData.name}, ${Math.round(testData.current.temp)}°C, ${testData.current.weather[0].description}`);
}

// Function to cycle through all theme combinations for comprehensive testing
function testAllThemes() {
    const allTestScenarios = [
        // Temperature extremes
        { temp: -15, weather: [{ main: 'Snow', description: 'blizzard', id: 602 }], humidity: 95, wind_speed: 20 },
        { temp: 40, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 15, wind_speed: 1 },
        
        // Weather conditions
        { temp: 0, weather: [{ main: 'Snow', description: 'light snow', id: 600 }], humidity: 80, wind_speed: 5 },
        { temp: 10, weather: [{ main: 'Rain', description: 'heavy rain', id: 502 }], humidity: 95, wind_speed: 15 },
        { temp: 15, weather: [{ main: 'Thunderstorm', description: 'thunderstorm', id: 210 }], humidity: 85, wind_speed: 25 },
        { temp: 20, weather: [{ main: 'Fog', description: 'fog', id: 741 }], humidity: 100, wind_speed: 1 },
        { temp: 25, weather: [{ main: 'Clouds', description: 'broken clouds', id: 803 }], humidity: 70, wind_speed: 8 },
        { temp: 30, weather: [{ main: 'Clear', description: 'clear sky', id: 800 }], humidity: 40, wind_speed: 3 }
    ];
    
    let currentIndex = 0;
    
    function showNextTheme() {
        if (currentIndex >= allTestScenarios.length) {
            console.log('🎨 All themes tested!');
            return;
        }
        
        const scenario = allTestScenarios[currentIndex];
        const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
        
        const testData = {
            name: randomCity,
            current: scenario,
            hourly: [],
            daily: []
        };
        
        // Display the test data
        document.getElementById('locationName').textContent = testData.name;
        document.getElementById('currentTemp').textContent = Math.round(testData.current.temp);
        document.getElementById('weatherDescription').textContent = testData.current.weather[0].description;
        document.getElementById('humidity').textContent = testData.current.humidity;
        document.getElementById('windSpeed').textContent = Math.round(testData.current.wind_speed * 3.6);

        // Apply the theme
        applyWeatherTheme(testData.current);

        // Show the weather
        document.getElementById('weather').style.display = 'block';
        
        console.log(`🎨 Testing theme ${currentIndex + 1}/${allTestScenarios.length}: ${testData.name}, ${Math.round(testData.current.temp)}°C, ${testData.current.weather[0].description}`);
        
        currentIndex++;
        
        // Auto-advance every 3 seconds
        setTimeout(showNextTheme, 3000);
    }
    
    showNextTheme();
}

// Simple function to test if themes are working
function testThemeApplication() {
    console.log('🧪 Testing theme application...');
    
    // Test hot sunny day
    const hotSunny = {
        temp: 35,
        weather: [{ main: 'Clear', description: 'clear sky', id: 800 }],
        humidity: 20,
        wind_speed: 1
    };
    
    // Apply theme
    applyWeatherTheme(hotSunny);
    
    // Check if classes were applied
    const bodyClasses = document.body.className;
    console.log('🎨 Body classes after theme application:', bodyClasses);
    
    // Test cold rainy night
    setTimeout(() => {
        const coldRainy = {
            temp: 5,
            weather: [{ main: 'Rain', description: 'moderate rain', id: 501 }],
            humidity: 95,
            wind_speed: 20
        };
        
        applyWeatherTheme(coldRainy);
        console.log('🎨 Body classes after second theme:', document.body.className);
    }, 2000);
}

// Force theme test - directly apply CSS classes
function forceThemeTest() {
    console.log('🔧 Force testing themes...');
    
    // Test hot theme
    document.body.className = 'theme-hot theme-sunny theme-day';
    console.log('🔥 Applied hot theme - should see red background');
    
    setTimeout(() => {
        // Test cold theme
        document.body.className = 'theme-cold theme-rainy theme-night';
        console.log('❄️ Applied cold rainy night theme - should see blue background');
    }, 2000);
    
    setTimeout(() => {
        // Test stormy theme
        document.body.className = 'theme-warm theme-stormy theme-day';
        console.log('⛈️ Applied warm stormy theme - should see dark background');
    }, 4000);
}

// Simple theme test - test one theme at a time
function testSingleTheme() {
    console.log('🧪 Testing single themes...');
    
    // Test just hot theme
    document.body.className = 'theme-hot';
    console.log('🔥 Hot theme only');
    
    setTimeout(() => {
        document.body.className = 'theme-rainy';
        console.log('🌧️ Rainy theme only');
    }, 2000);
    
    setTimeout(() => {
        document.body.className = 'theme-night';
        console.log('🌙 Night theme only');
    }, 4000);
    
    setTimeout(() => {
        document.body.className = 'theme-cool theme-rainy theme-night';
        console.log('🌧️ Cool rainy night combination');
    }, 6000);
}

// Test different times of day with the same weather
function testTimeOfDay() {
    console.log('🕐 Testing different times of day...');
    
    const testWeather = {
        temp: 20,
        weather: [{ main: 'Clear', description: 'clear sky', id: 800 }],
        humidity: 50,
        wind_speed: 5
    };
    
    let timeIndex = 0;
    
    function showNextTime() {
        if (timeIndex >= mockTimes.length) {
            console.log('🕐 All times tested!');
            return;
        }
        
        const mockTime = mockTimes[timeIndex];
        const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
        
        // Display weather data
        document.getElementById('locationName').textContent = randomCity;
        document.getElementById('currentTemp').textContent = Math.round(testWeather.temp);
        document.getElementById('weatherDescription').textContent = testWeather.weather[0].description;
        document.getElementById('humidity').textContent = testWeather.humidity;
        document.getElementById('windSpeed').textContent = Math.round(testWeather.wind_speed * 3.6);
        
        // Display mock time
        displayMockTime(mockTime);
        
        // Apply theme with mock time
        applyWeatherThemeWithMockTime(testWeather, mockTime);
        
        // Show the weather
        document.getElementById('weather').style.display = 'block';
        
        console.log(`🕐 Testing time: ${mockTime.label} (${mockTime.hour}:00)`);
        
        timeIndex++;
        
        // Auto-advance every 3 seconds
        setTimeout(showNextTime, 3000);
    }
    
    showNextTime();
}

// Test different weather icon variations
function testWeatherIcons() {
    console.log('🌤️ Testing different weather icons...');
    
    const iconTests = [
        { main: 'Clear', description: 'clear sky', icon: '01d' },
        { main: 'Clouds', description: 'few clouds', icon: '02d' },
        { main: 'Clouds', description: 'scattered clouds', icon: '03d' },
        { main: 'Clouds', description: 'broken clouds', icon: '04d' },
        { main: 'Rain', description: 'light rain', icon: '10d' },
        { main: 'Rain', description: 'moderate rain', icon: '10d' },
        { main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' },
        { main: 'Snow', description: 'light snow', icon: '13d' },
        { main: 'Mist', description: 'mist', icon: '50d' }
    ];
    
    let iconIndex = 0;
    
    function showNextIcon() {
        if (iconIndex >= iconTests.length) {
            console.log('🌤️ All weather icons tested!');
            return;
        }
        
        const testWeather = iconTests[iconIndex];
        const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];
        const randomTime = mockTimes[Math.floor(Math.random() * mockTimes.length)];
        
        // Create mock data with specific weather
        const mockData = {
            name: randomCity,
            current: {
                temp: 20,
                humidity: 60,
                wind_speed: 5,
                weather: [testWeather]
            },
            hourly: Array(24).fill().map((_, i) => ({
                dt: Date.now() / 1000 + (i * 3600),
                temp: 20 + (Math.random() - 0.5) * 4,
                pop: Math.random(),
                weather: [testWeather]
            })),
            daily: Array(7).fill().map((_, i) => ({
                dt: Date.now() / 1000 + (i * 86400),
                temp: { min: 15, max: 25 },
                weather: [testWeather]
            })),
            mockTime: randomTime
        };
        
        // Display the mock weather data
        document.getElementById('locationName').textContent = mockData.name;
        document.getElementById('currentTemp').textContent = Math.round(mockData.current.temp);
        document.getElementById('weatherDescription').textContent = mockData.current.weather[0].description;
        document.getElementById('humidity').textContent = mockData.current.humidity;
        document.getElementById('windSpeed').textContent = Math.round(mockData.current.wind_speed * 3.6);
        
        // Display mock time
        displayMockTime(mockData.mockTime);
        
        // Apply theme with mock time
        applyWeatherThemeWithMockTime(mockData.current, mockData.mockTime);
        
        // Show the weather and forecasts
        document.getElementById('weather').style.display = 'block';
        
        if (mockData.hourly) {
            displayForecast(mockData.hourly);
        }
        if (mockData.daily) {
            display7DayForecast(mockData.daily);
        }
        
        console.log(`🌤️ Testing weather icon: ${testWeather.description} (${testWeather.icon})`);
        
        iconIndex++;
        
        // Auto-advance every 2 seconds
        setTimeout(showNextIcon, 2000);
    }
    
    showNextIcon();
}
