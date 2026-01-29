// In-memory cache for fast lookups during the session
const tokenImageCache: Map<string, string | null> = new Map()

// Cache key prefix for localStorage
const CACHE_PREFIX = 'token_logo_'
const CACHE_EXPIRY_PREFIX = 'token_logo_expiry_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours (matches server cache)

// Initialize cache from localStorage
function initializeCache() {
  if (typeof window === 'undefined') return
  
  try {
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (key.startsWith(CACHE_PREFIX)) {
        const tokenSymbol = key.replace(CACHE_PREFIX, '')
        const expiryKey = CACHE_EXPIRY_PREFIX + tokenSymbol
        const expiry = localStorage.getItem(expiryKey)
        
        // Check if cache has expired
        if (expiry && parseInt(expiry) < Date.now()) {
          localStorage.removeItem(key)
          localStorage.removeItem(expiryKey)
        } else {
          // Load into memory cache
          const cachedUrl = localStorage.getItem(key)
          tokenImageCache.set(tokenSymbol, cachedUrl)
        }
      }
    }
  } catch (error) {
    console.warn('[v0] Could not initialize localStorage cache:', error)
  }
}

// Save to persistent cache
function saveToPersistentCache(symbol: string, url: string | null) {
  if (typeof window === 'undefined') return
  
  try {
    if (url) {
      localStorage.setItem(CACHE_PREFIX + symbol, url)
    } else {
      localStorage.setItem(CACHE_PREFIX + symbol, '')
    }
    localStorage.setItem(CACHE_EXPIRY_PREFIX + symbol, (Date.now() + CACHE_DURATION).toString())
  } catch (error) {
    console.warn('[v0] Could not save to localStorage cache:', error)
  }
}



export async function getTokenImageUrl(tokenSymbol: string): Promise<string | null> {
  const symbol = tokenSymbol.toUpperCase().trim()

  // Initialize cache from localStorage on first call
  if (tokenImageCache.size === 0 && typeof window !== 'undefined') {
    initializeCache()
  }

  // Check in-memory cache first (fastest)
  if (tokenImageCache.has(symbol)) {
    const cached = tokenImageCache.get(symbol)
    return cached === '' ? null : cached || null
  }

  try {
    // Fetch from server cache endpoint (reduces CoinGecko calls)
    const res = await fetch(`/api/tokens/cache?symbols=${symbol}`)
    if (res.ok) {
      const data = await res.json()
      const imageUrl = data[symbol] || null

      // Cache the result
      tokenImageCache.set(symbol, imageUrl || '')
      saveToPersistentCache(symbol, imageUrl)

      return imageUrl
    }

    // Fallback: Return null if server cache is unavailable
    console.warn(`[v0] Server token cache unavailable for ${symbol}`)
    tokenImageCache.set(symbol, '')
    saveToPersistentCache(symbol, null)
    return null
  } catch (error) {
    console.error(`[v0] Error fetching token image for ${symbol}:`, error)
    tokenImageCache.set(symbol, '')
    saveToPersistentCache(symbol, null)
    return null
  }
}

export function getTokenLogoFallback(tokenSymbol: string): string {
  // Return a colored background with the first two letters as fallback
  const symbol = tokenSymbol.toUpperCase().slice(0, 2)
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ]
  const colorIndex = symbol.charCodeAt(0) % colors.length
  return colors[colorIndex]
}
