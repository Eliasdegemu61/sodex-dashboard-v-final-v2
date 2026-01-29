import { NextResponse } from 'next/server'

export const revalidate = 21600 // 6 hours in seconds

export async function GET() {
  try {
    const response = await fetch(
      'https://mainnet-data.sodex.dev/api/v1/dashboard/volume?start_date=2024-01-01&end_date=2029-01-01&market_type=all'
    )
    const jsonData = await response.json()

    // Sum futures volume across ALL days in the dataset
    const dataArray = jsonData.data.data
    if (dataArray.length === 0) {
      return NextResponse.json({ futuresVolume: '0' })
    }

    let totalFuturesVolume = 0

    // Iterate through each day in the data array
    for (const dayData of dataArray) {
      const markets = dayData.markets || {}

      // Sum all futures pairs (those with - in the name) for this day
      for (const [marketName, volumeStr] of Object.entries(markets)) {
        // Only include pairs with "-" (futures pairs), exclude pairs with "/" (spot pairs)
        if (marketName.includes('-') && !marketName.includes('/')) {
          const volume = parseFloat(volumeStr as string)
          if (!isNaN(volume)) {
            totalFuturesVolume += volume
          }
        }
      }
    }

    console.log(`[v0] Total futures volume calculated: ${totalFuturesVolume}`)

    return NextResponse.json({ futuresVolume: totalFuturesVolume.toFixed(2) })
  } catch (error) {
    console.error('Error fetching futures volume:', error)
    return NextResponse.json({ futuresVolume: '0' }, { status: 500 })
  }
}
