require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const pool = require('../db/connection');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Fetch live weather forecast from OpenWeatherMap API.
 * Falls back to DB weather data if API key is not configured or API fails.
 * @param {number|string} location_id
 * @returns {Promise<{source: string, data: object[]}>}
 */
async function fetchWeatherForecast(location_id) {
  // Fetch location details for coordinates/city
  const locationResult = await pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
  if (locationResult.rows.length === 0) {
    throw new Error(`Location ${location_id} not found`);
  }
  const location = locationResult.rows[0];

  // Try live API if key is configured
  if (OPENWEATHER_API_KEY) {
    try {
      // Build query: prefer lat/lng, fallback to city/state name
      let apiUrl;
      if (location.latitude && location.longitude) {
        apiUrl = `${OPENWEATHER_BASE_URL}/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=${OPENWEATHER_API_KEY}&units=imperial&cnt=40`;
      } else {
        const city = encodeURIComponent(location.city || location.name || 'New York');
        apiUrl = `${OPENWEATHER_BASE_URL}/forecast?q=${city}&appid=${OPENWEATHER_API_KEY}&units=imperial&cnt=40`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API returned ${response.status}`);
      }
      const data = await response.json();

      // Normalize to our internal format (daily aggregates)
      const dailyMap = {};
      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = {
            forecast_date: date,
            condition: item.weather[0].main,
            description: item.weather[0].description,
            temp_high: item.main.temp_max,
            temp_low: item.main.temp_min,
            precipitation_chance: Math.round((item.pop || 0) * 100),
            wind_speed: item.wind.speed,
            humidity: item.main.humidity,
            source: 'openweathermap_live'
          };
        } else {
          // Keep highest temp_high and lowest temp_low across time slots
          dailyMap[date].temp_high = Math.max(dailyMap[date].temp_high, item.main.temp_max);
          dailyMap[date].temp_low = Math.min(dailyMap[date].temp_low, item.main.temp_min);
          dailyMap[date].precipitation_chance = Math.max(dailyMap[date].precipitation_chance, Math.round((item.pop || 0) * 100));
        }
      }

      const normalized = Object.values(dailyMap).slice(0, 7);
      console.log(`[WeatherService] Fetched live weather for location ${location_id} (${normalized.length} days)`);
      return { source: 'live', location, data: normalized };
    } catch (apiErr) {
      console.warn(`[WeatherService] Live API failed for location ${location_id}: ${apiErr.message}. Falling back to DB.`);
    }
  }

  // Fallback: DB weather data
  const dbResult = await pool.query(
    'SELECT * FROM weather_forecasts WHERE location_id = $1 ORDER BY forecast_date ASC',
    [location_id]
  );
  console.log(`[WeatherService] Using DB weather data for location ${location_id} (${dbResult.rows.length} records)`);
  return { source: 'database', location, data: dbResult.rows };
}

module.exports = { fetchWeatherForecast };
