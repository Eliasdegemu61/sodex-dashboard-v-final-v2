export async function GET() {
  try {
    const endDate = new Date()
    const startDate = new Date('2024-01-01')

    const url = new URL(
      'https://mainnet-data.sodex.dev/api/v1/dashboard/volume'
    )
    url.searchParams.set('start_date', startDate.toISOString().split('T')[0])
    url.searchParams.set('end_date', endDate.toISOString().split('T')[0])
    url.searchParams.set('market_type', 'all')

    const response = await fetch(url.toString(), {
      next: { revalidate: 21600 }, // Cache for 6 hours (21600 seconds)
    })
    const jsonData = await response.json()

    const dataArray = jsonData.data.data
    if (dataArray.length === 0) {
      return Response.json(
        {
          topSpotPairs: [],
          topFuturesPairs: [],
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
          },
        }
      )
    }

    // Aggregate volumes across all days
    const spotVolumes: Record<string, number> = {}
    const futuresVolumes: Record<string, number> = {}

    for (const dayData of dataArray) {
      const markets = dayData.markets || {}

      for (const [marketName, volumeStr] of Object.entries(markets)) {
        const volume = parseFloat(volumeStr as string)
        if (!isNaN(volume)) {
          if (marketName.includes('/')) {
            // Spot pair
            spotVolumes[marketName] = (spotVolumes[marketName] || 0) + volume
          } else if (marketName.includes('-')) {
            // Futures pair
            futuresVolumes[marketName] =
              (futuresVolumes[marketName] || 0) + volume
          }
        }
      }
    }

    // Get top 5 spot pairs
    const topSpotPairs = Object.entries(spotVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, volume]) => ({
        name,
        volume: volume.toFixed(2),
      }))

    // Get top 5 futures pairs
    const topFuturesPairs = Object.entries(futuresVolumes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, volume]) => ({
        name,
        volume: volume.toFixed(2),
      }))

    console.log(
      `[v0] Top Pairs - Spot: ${topSpotPairs.map((p) => `${p.name}:${p.volume}`).join(', ')}`
    )
    console.log(
      `[v0] Top Pairs - Futures: ${topFuturesPairs.map((p) => `${p.name}:${p.volume}`).join(', ')}`
    )

    return Response.json(
      {
        topSpotPairs,
        topFuturesPairs,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching top pairs:', error)
    return Response.json(
      { error: 'Failed to fetch top pairs' },
      { status: 500 }
    )
  }
}
