const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    temperature_2m?: number[]
    relative_humidity_2m?: number[]
    precipitation_probability?: number[]
    wind_speed_10m?: number[]
  }
  daily?: {
    time: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
  }
}

export interface HistoricalData {
  date: string
  temperatureMax: number
  temperatureMin: number
}

export interface ForecastData {
  time: string
  temperature: number
  humidity: number | null
  precipitationProbability: number | null
  windSpeed: number | null
}

export async function getHistoricalForecasts(
  lat: number,
  lon: number,
  pastDays: number = 5
): Promise<HistoricalData[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    daily: "temperature_2m_max,temperature_2m_min",
    past_days: pastDays.toString(),
    timezone: "auto",
    forecast_days: "0",
  })

  const url = `${OPEN_METEO_BASE}/forecast?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data: OpenMeteoResponse = await response.json()

  if (!data.daily) return []

  return data.daily.time.map((date, i) => ({
    date,
    temperatureMax: data.daily!.temperature_2m_max![i],
    temperatureMin: data.daily!.temperature_2m_min![i],
  }))
}

export async function getOpenMeteoForecast(
  lat: number,
  lon: number,
  forecastDays: number = 7
): Promise<ForecastData[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m",
    forecast_days: forecastDays.toString(),
    timezone: "auto",
  })

  const url = `${OPEN_METEO_BASE}/forecast?${params.toString()}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`)
  }

  const data: OpenMeteoResponse = await response.json()

  return data.hourly.time.map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m?.[i] ?? 0,
    humidity: data.hourly.relative_humidity_2m?.[i] ?? null,
    precipitationProbability: data.hourly.precipitation_probability?.[i] ?? null,
    windSpeed: data.hourly.wind_speed_10m?.[i] ?? null,
  }))
}

export function calculateBias(
  historicalForecasts: HistoricalData[],
  currentForecast: ForecastData[]
): number {
  if (historicalForecasts.length === 0) return 0

  const avgMax = historicalForecasts.reduce((sum, d) => sum + d.temperatureMax, 0) / historicalForecasts.length
  const avgMin = historicalForecasts.reduce((sum, d) => sum + d.temperatureMin, 0) / historicalForecasts.length
  const avgHistorical = (avgMax + avgMin) / 2

  const currentAvg =
    currentForecast.reduce((sum, f) => sum + f.temperature, 0) / currentForecast.length

  return currentAvg - avgHistorical
}

export function calculateHistoricalStdDev(
  historicalForecasts: HistoricalData[],
  currentForecast: ForecastData[]
): number {
  if (historicalForecasts.length < 2 || currentForecast.length === 0) return 0.1

  const currentAvg =
    currentForecast.reduce((sum, f) => sum + f.temperature, 0) / currentForecast.length

  const squaredDiffs = historicalForecasts.map((d) => {
    const dayAvg = (d.temperatureMax + d.temperatureMin) / 2
    return (dayAvg - currentAvg) ** 2
  })

  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / squaredDiffs.length
  return Math.sqrt(variance)
}
