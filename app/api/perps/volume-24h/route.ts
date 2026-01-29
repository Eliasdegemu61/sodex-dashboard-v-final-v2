import { NextResponse } from 'next/server'

const CACHE_DURATION = 6 * 60 * 60 // 6 hours in seconds
let cachedData: {
  data: unknown
  timestamp: number
} | null = null

export async function GET() {
  const now = Date.now()

  // Check if we have cached data that's still valid
  if (
    cachedData &&
    now - cachedData.timestamp < CACHE_DURATION * 1000
  ) {
    return NextResponse.json(cachedData.data)
  }

  try {
    // Fetch volume data from Sodex API
    const response = await fetch(
      'https://mainnet-data.sodex.dev/api/v1/dashboard/volume?start_date=2024-01-01&end_date=2029-01-01&market_type=all',
    )

    // Check if response is ok
    if (!response.ok) {
      console.error(`[v0] Volume API returned status ${response.status}`)
      throw new Error(`HTTP Error: ${response.status}`)
    }

    // Check content-type to ensure it's JSON
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      console.error('[v0] Volume API returned non-JSON response:', contentType)
      throw new Error('API returned non-JSON response')
    }

    const jsonData = await response.json()
    const dataArray = jsonData.data.data

    if (dataArray.length === 0) {
      return NextResponse.json({
        spotVolume24h: '0',
        futuresVolume24h: '0',
        totalVolume24h: '0',
        top3SpotTokens: [],
        top3FuturesTokens: [],
      })
    }

    // Get the last entry (most recent data)
    const mostRecentData = dataArray[dataArray.length - 1]
    const markets = mostRecentData.markets || {}
    const timestamp = mostRecentData.timestamp

    let spotVolume24h = 0
    let futuresVolume24h = 0
    const tokenVolumes: Record<string, number> = {}

    // Iterate through all pairs and aggregate by token
    for (const [marketName, volumeStr] of Object.entries(markets)) {
      const volume = parseFloat(volumeStr as string)
      if (isNaN(volume)) continue

      // Extract token name (e.g., "BTC" from "BTC/USDC" or "BTC-USD")
      let tokenName = marketName.split(/[/-]/)[0]

      if (marketName.includes('/')) {
        // Spot pair
        spotVolume24h += volume
        tokenVolumes[tokenName] = (tokenVolumes[tokenName] || 0) + volume
      } else if (marketName.includes('-')) {
        // Futures pair
        futuresVolume24h += volume
        tokenVolumes[tokenName] = (tokenVolumes[tokenName] || 0) + volume
      }
    }

    // Separate spot and futures volumes by token
    const spotTokenVolumes: Record<string, number> = {}
    const futuresTokenVolumes: Record<string, number> = {}

    // Re-iterate to properly separate spot and futures
    for (const [marketName, volumeStr] of Object.entries(markets)) {
      const volume = parseFloat(volumeStr as string)
      if (isNaN(volume)) continue

      let tokenName = marketName.split(/[/-]/)[0]

      if (marketName.includes('/')) {
        // Spot pair
        spotTokenVolumes[tokenName] = (spotTokenVolumes[tokenName] || 0) + volume
      } else if (marketName.includes('-')) {
        // Futures pair
        futuresTokenVolumes[tokenName] = (futuresTokenVolumes[tokenName] || 0) + volume
      }
    }

    // Get top 3 tokens by spot volume
    const top3SpotTokens = Object.entries(spotTokenVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, volume]) => ({
        name,
        volume: volume.toFixed(2),
      }))

    // Get top 3 tokens by futures volume
    const top3FuturesTokens = Object.entries(futuresTokenVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, volume]) => ({
        name,
        volume: volume.toFixed(2),
      }))

    const totalVolume24h = spotVolume24h + futuresVolume24h

    const result = {
      spotVolume24h: spotVolume24h.toFixed(2),
      futuresVolume24h: futuresVolume24h.toFixed(2),
      totalVolume24h: totalVolume24h.toFixed(2),
      top3SpotTokens,
      top3FuturesTokens,
      timestamp,
    }

    // Cache the result
    cachedData = {
      data: result,
      timestamp: now,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Error fetching 24h volume:', error)
    return NextResponse.json(
      {
        spotVolume24h: '0',
        futuresVolume24h: '0',
        totalVolume24h: '0',
        top3SpotTokens: [],
        top3FuturesTokens: [],
      },
      { status: 500 },
    )
  }
}
