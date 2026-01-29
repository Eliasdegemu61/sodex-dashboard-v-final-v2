import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  try {
    const url = `https://mainnet-data.sodex.dev/api/v1/perps/pnl/overview?account_id=${accountId}`
    console.log(`[v0] Volume API: Fetching from ${url}`)
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(`[v0] Volume API: HTTP ${res.status} - ${res.statusText}`)
      return NextResponse.json({ 
        error: `Failed to fetch volume: ${res.statusText}`,
        cumulativeVolume: 0,
        cumulativePnl: 0
      }, { status: res.status })
    }

    const response = await res.json()
    console.log(`[v0] Volume API: Response received`, response)

    // Extract data from nested structure
    const cumulativeVolume = parseFloat(response.data?.cumulative_quote_volume || '0')
    const cumulativePnl = parseFloat(response.data?.cumulative_pnl || '0')

    console.log(`[v0] Volume API: Account ${accountId}, Volume: ${cumulativeVolume}, Cumulative PnL: ${cumulativePnl}`)

    return NextResponse.json({
      cumulativeVolume: cumulativeVolume,
      cumulativePnl: cumulativePnl,
    })
  } catch (error) {
    console.error('[v0] Error fetching volume:', error)
    return NextResponse.json({ 
      error: `Failed to fetch volume: ${error instanceof Error ? error.message : 'Unknown error'}`,
      cumulativeVolume: 0,
      cumulativePnl: 0
    }, { status: 500 })
  }
}
