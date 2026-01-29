import { NextRequest, NextResponse } from 'next/server'

// In-memory server-side cache (persists across requests during deployment)
const serverTokenCache: Map<string, { url: string | null; timestamp: number }> = new Map()

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000

// CoinGecko token ID mapping
const TOKEN_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  FTM: 'fantom',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  UNI: 'uniswap',
  AAVE: 'aave',
  CURVE: 'curve-dao-token',
  ARB: 'arbitrum',
  OP: 'optimism',
  ATOM: 'cosmos',
  XRP: 'ripple',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  XMR: 'monero',
  ZEC: 'zcash',
  NEAR: 'near',
  FLOW: 'flow',
  THG: 'thorium',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  BUSD: 'binance-usd',
  TUSD: 'true-usd',
  USDP: 'paxos-standard',
  FRAX: 'frax',
  TON: 'the-open-network',
  JTO: 'jito-governance-token',
  WIF: 'dogwifcoin',
  ORCA: 'orca',
  COPE: 'cope-token',
  PYTH: 'pyth-network',
  RENDER: 'render-token',
  EPYC: 'epyc',
  AI: 'sleepless-ai',
  GPU: 'gpu',
  POPCAT: 'popcoin',
  HNT: 'helium',
  MOBILE: 'helium-mobile',
}

// Direct URL mapping for tokens with custom logos
const DIRECT_URL_MAP: Record<string, string> = {
  'MAG7SSI': 'https://sosovalue.com/img/ssi/mag7.svg',
  'SOSO': 'https://sosovalue.com/_next/image?url=https%3A%2F%2Fstatic.sosovalue.com%2Fsosovalue%2F2025%2F01%2F24%2F664617be-cb7b-4dce-8317-4deae2ff0a55.png&w=32&q=75',
  'XAUT': 'https://assets.coingecko.com/coins/images/10481/standard/Tether_Gold.png?1696510471',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png?1696501409',
}

async function fetchFromCoinGecko(coinGeckoId: string): Promise<string | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false`,
      {
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[v0] Rate limited for CoinGecko ID: ${coinGeckoId}`)
      } else if (res.status === 404) {
        // Silently handle 404 - coin not found
      } else {
        console.warn(`[v0] CoinGecko fetch failed for ${coinGeckoId}: HTTP ${res.status}`)
      }
      return null
    }

    const data = await res.json()
    return data.image?.large || data.image?.small || null
  } catch (fetchError) {
    clearTimeout(timeoutId)

    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      console.warn(`[v0] Timeout fetching CoinGecko ID: ${coinGeckoId}`)
    } else if (fetchError instanceof Error) {
      console.warn(`[v0] Error fetching CoinGecko ID: ${coinGeckoId} - ${fetchError.message}`)
    }

    return null
  }
}

async function tryTokenVariations(symbol: string): Promise<string | null> {
  const variations = [
    symbol.toLowerCase(),
    symbol.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
    symbol.toLowerCase() + '-token',
  ]

  // Only try the first few variations with a race condition
  // First variation has priority, use Promise.race to return fast
  const promises = variations.map(variation => fetchFromCoinGecko(variation))
  
  try {
    // Create a timeout promise that rejects after 3 seconds total
    const timeoutPromise = new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    )
    
    for (const promise of promises) {
      const imageUrl = await Promise.race([promise, timeoutPromise])
      if (imageUrl) {
        return imageUrl
      }
    }
  } catch (e) {
    // Timeout or error - return null
  }

  return null
}

async function getTokenImageUrlServer(tokenSymbol: string): Promise<string | null> {
  const symbol = tokenSymbol.toUpperCase().trim()

  // Check server cache first
  const cached = serverTokenCache.get(symbol)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url
  }

  // Check direct URL map
  if (DIRECT_URL_MAP[symbol]) {
    const directUrl = DIRECT_URL_MAP[symbol]
    serverTokenCache.set(symbol, { url: directUrl, timestamp: Date.now() })
    return directUrl
  }

  // Fetch from CoinGecko
  let coinGeckoId = TOKEN_ID_MAP[symbol]
  let imageUrl: string | null = null

  if (coinGeckoId) {
    imageUrl = await fetchFromCoinGecko(coinGeckoId)
  } else {
    imageUrl = await tryTokenVariations(symbol)
  }

  // Cache the result
  serverTokenCache.set(symbol, { url: imageUrl, timestamp: Date.now() })

  return imageUrl || null
}

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get('symbols')

  if (!symbols) {
    return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 })
  }

  const symbolList = symbols.split(',').map(s => s.trim())

  const results: Record<string, string | null> = {}

  // Create a timeout promise for the entire operation (10 seconds max)
  const operationTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Token fetch timeout')), 10000)
  )

  try {
    // Fetch images for all symbols (parallelized with timeout)
    await Promise.race([
      Promise.all(
        symbolList.map(async (symbol) => {
          const imageUrl = await getTokenImageUrlServer(symbol)
          results[symbol] = imageUrl
        })
      ),
      operationTimeout,
    ])
  } catch (error) {
    // If timeout occurs, return partial results with nulls for missing ones
    symbolList.forEach((symbol) => {
      if (!(symbol in results)) {
        results[symbol] = null
      }
    })
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
