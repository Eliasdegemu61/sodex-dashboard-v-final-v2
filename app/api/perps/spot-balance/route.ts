import { NextResponse } from 'next/server'

interface PriceData {
  s: string
  p: string
  t: number
}

interface SpotBalanceItem {
  coin: string
  balance: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  try {
    // Fetch spot balance
    const balanceRes = await fetch(
      `https://mainnet-gw.sodex.dev/pro/p/user/balance/list?accountId=${accountId}`
    )
    const balanceJsonRaw = await balanceRes.json()
    const balanceData = balanceJsonRaw.data || balanceJsonRaw

    // Fetch mark prices
    const priceRes = await fetch(
      'https://mainnet-gw.sodex.dev/futures/fapi/market/v1/public/q/mark-price'
    )
    const pricesJsonRaw = await priceRes.json()
    const pricesArray = pricesJsonRaw.data || pricesJsonRaw

    // Build price map: "BTC-USD" -> 95250.125
    const priceMap: Record<string, number> = {}
    if (Array.isArray(pricesArray)) {
      pricesArray.forEach((item: PriceData) => {
        priceMap[item.s] = parseFloat(item.p)
      })
    }

    console.log('[v0] Price map keys:', Object.keys(priceMap).length, 'prices loaded')

    // Calculate total spot balance in USD
    let totalSpotBalance = 0

    if (balanceData.spotBalance && Array.isArray(balanceData.spotBalance)) {
      balanceData.spotBalance.forEach((balance: SpotBalanceItem) => {
        const coinName = balance.coin
        const coinBalance = parseFloat(balance.balance)

        // Remove v/w prefix (handle both cases - case insensitive)
        let cleanCoin = coinName
        const lowerCoinName = coinName.toLowerCase()
        if (lowerCoinName.startsWith('v')) {
          cleanCoin = coinName.substring(1)
        } else if (lowerCoinName.startsWith('w')) {
          cleanCoin = coinName.substring(1)
        }

        // Handle special case MAG7.ssi -> MAG7
        if (cleanCoin.includes('.ssi')) {
          cleanCoin = cleanCoin.replace('.ssi', '')
        }

        // Build market symbol: ETH -> ETH-USD, SOSO -> SOSO-USD
        const marketSymbol = cleanCoin.toUpperCase() + '-USD'

        // Get price from map
        let price = priceMap[marketSymbol] || 0

        // Handle stablecoins (USDC, USDT, UST = 1 USD)
        if (price === 0) {
          const upperClean = cleanCoin.toUpperCase()
          if (upperClean === 'USDC' || upperClean === 'USDT' || upperClean === 'UST') {
            price = 1
          }
        }

        const usdValue = coinBalance * price
        totalSpotBalance += usdValue

        console.log(`[v0] ${coinName} (${marketSymbol}): ${coinBalance} × ${price} = ${usdValue}`)
      })
    }

    console.log('[v0] Total spot balance USD:', totalSpotBalance)

    return NextResponse.json({
      totalSpotBalance: totalSpotBalance,
    })
  } catch (error) {
    console.error('[v0] Error fetching spot balance:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch spot balance',
      totalSpotBalance: 0
    }, { status: 500 })
  }
}
