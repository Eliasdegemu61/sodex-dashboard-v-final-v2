import { NextRequest, NextResponse } from 'next/server'

// Cache for spot volume data with 6-hour expiry
let cachedVolumeData: { volume: string; timestamp: number } | null = null
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

async function fetchSpotVolumeFromAPI(): Promise<string> {
  try {
    const today = new Date()
    const endDate = today.toISOString().split('T')[0]
    
    // Start from 2024-01-01 as per user example
    const startDate = '2024-01-01'
    
    const url = `https://mainnet-data.sodex.dev/api/v1/dashboard/volume?start_date=${startDate}&end_date=${endDate}&market_type=all`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }

    const jsonData = await response.json()
    
    // Extract the most recent volume data
    // The data structure: { data: { data: [ { markets: { "PAIR/USDC": "123.45", ... } }, ... ] } }
    if (!jsonData.data || !jsonData.data.data || !Array.isArray(jsonData.data.data)) {
      console.error('Unexpected API response structure:', jsonData)
      return '0'
    }

    // Sum spot volume across ALL days in the dataset
    const dataArray = jsonData.data.data
    if (dataArray.length === 0) {
      return '0'
    }

    let totalSpotVolume = 0
    let daysProcessed = 0

    // Iterate through each day in the data array
    for (const dayData of dataArray) {
      const markets = dayData.markets || {}
      daysProcessed++

      // Sum all spot pairs (those with / in the name) for this day
      for (const [marketName, volumeStr] of Object.entries(markets)) {
        // Only include pairs with "/" (spot pairs), exclude pairs with "-" (futures pairs)
        if (marketName.includes('/')) {
          const volume = parseFloat(volumeStr as string)
          if (!isNaN(volume)) {
            totalSpotVolume += volume
          }
        }
      }
    }
    
    console.log(`[v0] Total spot volume calculated across ${daysProcessed} days: ${totalSpotVolume}`)

    return totalSpotVolume.toString()
  } catch (error) {
    console.error('Error fetching spot volume:', error)
    return '0'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if cache is still valid
    const now = Date.now()
    if (cachedVolumeData && (now - cachedVolumeData.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        spotVolume: cachedVolumeData.volume,
        cached: true,
        nextUpdateIn: CACHE_DURATION - (now - cachedVolumeData.timestamp)
      })
    }

    // Fetch fresh data
    const spotVolume = await fetchSpotVolumeFromAPI()
    
    // Update cache
    cachedVolumeData = {
      volume: spotVolume,
      timestamp: now
    }

    return NextResponse.json({
      spotVolume: spotVolume,
      cached: false,
      nextUpdateIn: CACHE_DURATION
    })
  } catch (error) {
    console.error('Error in spot volume route:', error)
    return NextResponse.json({
      spotVolume: '0',
      error: 'Failed to fetch spot volume'
    }, { status: 500 })
  }
}
