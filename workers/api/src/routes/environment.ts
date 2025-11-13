import { Hono } from 'hono';
import type { Env } from '../index';

export const environmentRoutes = new Hono<{ Bindings: Env }>();

/**
 * GET /api/environment/current
 */
environmentRoutes.get('/current', async (c) => {
  try {
    const lat = c.req.query('lat');
    const lon = c.req.query('lon');
    const city = c.req.query('city');

    if (!lat && !lon && !city) {
      return c.json({
        success: false,
        message: 'Either coordinates (lat, lon) or city name is required',
      }, 400);
    }

    // Get weather data
    let weatherData;
    if (lat && lon) {
      weatherData = await getWeatherByCoords(parseFloat(lat), parseFloat(lon), c.env.OPENWEATHER_API_KEY, c.env.CACHE);
    } else if (city) {
      weatherData = await getWeatherByCity(city, c.env.OPENWEATHER_API_KEY, c.env.CACHE);
    }

    // Get time of day
    const currentHour = new Date().getHours();
    const timeOfDay = getTimeOfDay(currentHour);

    return c.json({
      success: true,
      data: {
        weather: weatherData,
        timeOfDay: {
          current: timeOfDay,
          hour: currentHour,
        },
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Environment data error:', error);
    return c.json({
      success: false,
      message: error.message || 'Failed to fetch environment data',
    }, 400);
  }
});

/**
 * GET /api/environment/weather
 */
environmentRoutes.get('/weather', async (c) => {
  try {
    const lat = c.req.query('lat');
    const lon = c.req.query('lon');
    const city = c.req.query('city');

    let weatherData;
    if (lat && lon) {
      weatherData = await getWeatherByCoords(parseFloat(lat), parseFloat(lon), c.env.OPENWEATHER_API_KEY, c.env.CACHE);
    } else if (city) {
      weatherData = await getWeatherByCity(city, c.env.OPENWEATHER_API_KEY, c.env.CACHE);
    } else {
      return c.json({
        success: false,
        message: 'Either coordinates or city is required',
      }, 400);
    }

    return c.json({
      success: true,
      data: weatherData,
    });
  } catch (error: any) {
    return c.json({
      success: false,
      message: error.message || 'Failed to fetch weather',
    }, 400);
  }
});

/**
 * GET /api/environment/time-of-day
 */
environmentRoutes.get('/time-of-day', async (c) => {
  const currentHour = new Date().getHours();
  const timeOfDay = getTimeOfDay(currentHour);

  return c.json({
    success: true,
    data: {
      timeOfDay,
      hour: currentHour,
      timestamp: new Date(),
    },
  });
});

// Helper functions
function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function normalizeWeatherCondition(weatherCode: number): string {
  if (weatherCode >= 200 && weatherCode < 300) return 'rain';
  if (weatherCode >= 300 && weatherCode < 600) return 'rain';
  if (weatherCode >= 600 && weatherCode < 700) return 'snow';
  if (weatherCode >= 700 && weatherCode < 800) return 'other';
  if (weatherCode === 800) return 'clear';
  if (weatherCode > 800 && weatherCode < 900) return 'clouds';
  return 'other';
}

async function getWeatherByCoords(
  lat: number,
  lon: number,
  apiKey: string,
  cache: KVNamespace
): Promise<any> {
  const cacheKey = `weather:${lat}:${lon}`;
  
  // Check cache
  const cached = await cache.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Fetch from API (mock if no API key)
  if (!apiKey) {
    const mockData = {
      location: 'Tokyo',
      temperature: 20,
      condition: 'clear',
      conditionCode: 800,
      description: 'clear sky',
      humidity: 60,
      windSpeed: 3.5,
      timestamp: new Date(),
    };
    await cache.put(cacheKey, JSON.stringify(mockData), { expirationTtl: 300 });
    return mockData;
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ja`
  );

  if (!response.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await response.json();
  const weatherData = {
    location: data.name,
    temperature: Math.round(data.main.temp),
    conditionCode: data.weather[0].id,
    condition: normalizeWeatherCondition(data.weather[0].id),
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    timestamp: new Date(),
  };

  // Cache for 5 minutes
  await cache.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 300 });

  return weatherData;
}

async function getWeatherByCity(
  city: string,
  apiKey: string,
  cache: KVNamespace
): Promise<any> {
  const cacheKey = `weather:city:${city}`;
  
  const cached = await cache.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  if (!apiKey) {
    const mockData = {
      location: city,
      temperature: 20,
      condition: 'clear',
      conditionCode: 800,
      description: 'clear sky',
      humidity: 60,
      windSpeed: 3.5,
      timestamp: new Date(),
    };
    await cache.put(cacheKey, JSON.stringify(mockData), { expirationTtl: 300 });
    return mockData;
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`
  );

  if (!response.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await response.json();
  const weatherData = {
    location: data.name,
    temperature: Math.round(data.main.temp),
    conditionCode: data.weather[0].id,
    condition: normalizeWeatherCondition(data.weather[0].id),
    description: data.weather[0].description,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    timestamp: new Date(),
  };

  await cache.put(cacheKey, JSON.stringify(weatherData), { expirationTtl: 300 });

  return weatherData;
}
