import { Decimal } from 'decimal.js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return Response.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    // Set high precision for financial math
    const getContext = () => {
      // Simulate decimal.getcontext().prec = 50
      Decimal.set({ precision: 50 })
    }
    getContext()

    // Fetch live prices for fee calculation
    let prices: Record<string, Decimal> = {}
    try {
      const priceResp = await fetch(
        'https://mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/mark-price'
      )
      if (priceResp.ok) {
        const priceData = await priceResp.json()
        if (priceData.data && Array.isArray(priceData.data)) {
          priceData.data.forEach((p: any) => {
            prices[p.s] = new Decimal(p.p)
          })
        }
      }
    } catch (e) {
      console.error('Error fetching prices:', e)
    }

    let totalVol = new Decimal('0')
    let totalFees = new Decimal('0')
    let cursor = ''
    let page = 0
    let isTeam = false

    // Recursive trade fetching
    while (true) {
      page += 1
      let url = `https://mainnet-data.sodex.dev/api/v1/spot/trades?account_id=${accountId}&limit=1000`
      if (cursor) {
        url += `&cursor=${cursor}`
      }

      try {
        const resp = await fetch(url)
        if (!resp.ok) {
          if (page === 1) {
            // No trades found
            return Response.json({
              userId: accountId,
              volume_usd: 0,
              fees_usd: 0,
              is_team: false,
              pages: 0,
            })
          }
          break
        }

        const data = await resp.json()
        const trades = data.data || []

        if (!trades || trades.length === 0) {
          if (page === 1) {
            return Response.json({
              userId: accountId,
              volume_usd: 0,
              fees_usd: 0,
              is_team: false,
              pages: 0,
            })
          }
          break
        }

        // Process each trade
        for (const t of trades) {
          const p = new Decimal(t.price?.toString() || '0')
          const q = new Decimal(t.quantity?.toString() || '0')
          const f = new Decimal(t.fee?.toString() || '0')
          const side = parseInt(t.side?.toString() || '1')

          // Volume: Quantity * Price
          totalVol = totalVol.plus(q.times(p))

          // FEE LOGIC:
          // Side 1 (Buy) -> Fee is in asset, multiply by price.
          // Side 2 (Sell) -> Fee is in USDC, take as is.
          if (side === 1) {
            totalFees = totalFees.plus(f.times(p))
          } else {
            totalFees = totalFees.plus(f)
          }
        }

        // Check for next page cursor
        cursor = data.meta?.next_cursor || ''
        if (!cursor) {
          break
        }
      } catch (e) {
        console.error(`Error fetching page ${page}:`, e)
        break
      }
    }

    // Check if team (no fees)
    isTeam = totalFees.equals(0)

    return Response.json({
      userId: accountId,
      volume_usd: parseFloat(totalVol.toFixed(2)),
      fees_usd: parseFloat(totalFees.toFixed(6)),
      is_team: isTeam,
      pages: page,
    })
  } catch (error) {
    console.error('Error in spot trading endpoint:', error)
    return Response.json(
      { error: 'Failed to fetch spot trading data' },
      { status: 500 }
    )
  }
}
