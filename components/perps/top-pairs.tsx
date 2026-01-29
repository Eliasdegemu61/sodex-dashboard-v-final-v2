'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { getTokenImageUrl, getTokenLogoFallback } from '@/lib/token-images'
import Image from 'next/image'

interface PairData {
  name: string
  volume: string
  tokenImage?: string
}

// Client-side cache with 6-hour TTL
const CACHE_KEY = 'topPairsCache'
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

function getFromCache(): PairData[] | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    // Return cached data if still fresh
    if (now - timestamp < CACHE_DURATION) {
      return data
    }
    
    // Clear expired cache
    sessionStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('[v0] Cache parse error:', error)
  }
  
  return null
}

function saveToCache(data: PairData[]): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    )
  } catch (error) {
    console.error('[v0] Cache save error:', error)
  }
}

export function TopPairs() {
  const [topSpotPairs, setTopSpotPairs] = useState<PairData[]>([])
  const [topFuturesPairs, setTopFuturesPairs] = useState<PairData[]>([])
  const [loading, setLoading] = useState(true)
  const fetchInitiated = useRef(false)
  const imagesInitiated = useRef(false)

  // First effect: Fetch pairs data FAST without waiting for images
  useEffect(() => {
    // Prevent duplicate fetches on mount
    if (fetchInitiated.current) return
    fetchInitiated.current = true

    const fetchTopPairs = async () => {
      // Check cache first
      const cachedData = getFromCache()
      if (cachedData && cachedData.length > 0) {
        setTopSpotPairs(cachedData.filter((p) => p.name.includes('/')))
        setTopFuturesPairs(cachedData.filter((p) => p.name.includes('-')))
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/perps/top-pairs', {
          cache: 'force-cache', // Use browser cache
        })
        const data = await res.json()

        // Set data WITHOUT images first to render quickly
        setTopSpotPairs(data.topSpotPairs || [])
        setTopFuturesPairs(data.topFuturesPairs || [])
        setLoading(false)
      } catch (error) {
        console.error('[v0] Error fetching top pairs:', error)
        setLoading(false)
      }
    }

    fetchTopPairs()
  }, [])

  // Second effect: Load images AFTER initial render
  useEffect(() => {
    if (imagesInitiated.current || loading || (topSpotPairs.length === 0 && topFuturesPairs.length === 0)) return
    imagesInitiated.current = true

    const loadImages = async () => {
      // Fetch token images for spot pairs
      const spotWithImages = await Promise.all(
        topSpotPairs.map(async (pair: PairData) => {
          const tokenSymbol = pair.name.split('/')[0]
          const image = await getTokenImageUrl(tokenSymbol)
          return { ...pair, tokenImage: image }
        })
      )

      // Fetch token images for futures pairs
      const futuresWithImages = await Promise.all(
        topFuturesPairs.map(async (pair: PairData) => {
          const tokenSymbol = pair.name.split('-')[0]
          const image = await getTokenImageUrl(tokenSymbol)
          return { ...pair, tokenImage: image }
        })
      )

      const allPairs = [...spotWithImages, ...futuresWithImages]
      saveToCache(allPairs)

      setTopSpotPairs(spotWithImages)
      setTopFuturesPairs(futuresWithImages)
    }

    loadImages()
  }, [topSpotPairs, topFuturesPairs, loading])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Traded Pairs (Volume)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Traded Pairs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spot Pairs */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Top Spot Pairs
            </h3>
            <div className="space-y-2">
              {topSpotPairs.length > 0 ? (
                topSpotPairs.map((pair, idx) => {
                  const tokenSymbol = pair.name.split('/')[0]
                  const fallbackColor = getTokenLogoFallback(tokenSymbol)
                  
                  return (
                    <div
                      key={pair.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground w-5 h-5 rounded-full flex items-center justify-center bg-primary/20">
                          {idx + 1}
                        </span>
                        {pair.tokenImage ? (
                          <Image
                            src={pair.tokenImage || "/placeholder.svg"}
                            alt={tokenSymbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${fallbackColor} text-white text-xs font-bold`}>
                            {tokenSymbol.slice(0, 2)}
                          </div>
                        )}
                        <span className="text-sm font-medium">{pair.name}</span>
                      </div>
                      <span className="text-sm text-foreground font-semibold">
                        ${parseFloat(pair.volume).toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  No spot pair data available
                </p>
              )}
            </div>
          </div>

          {/* Futures Pairs */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              Top Futures Pairs
            </h3>
            <div className="space-y-2">
              {topFuturesPairs.length > 0 ? (
                topFuturesPairs.map((pair, idx) => {
                  const tokenSymbol = pair.name.split('-')[0]
                  const fallbackColor = getTokenLogoFallback(tokenSymbol)
                  
                  return (
                    <div
                      key={pair.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground w-5 h-5 rounded-full flex items-center justify-center bg-primary/20">
                          {idx + 1}
                        </span>
                        {pair.tokenImage ? (
                          <Image
                            src={pair.tokenImage || "/placeholder.svg"}
                            alt={tokenSymbol}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${fallbackColor} text-white text-xs font-bold`}>
                            {tokenSymbol.slice(0, 2)}
                          </div>
                        )}
                        <span className="text-sm font-medium">{pair.name}</span>
                      </div>
                      <span className="text-sm text-foreground font-semibold">
                        ${parseFloat(pair.volume).toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-xs text-muted-foreground">
                  No futures pair data available
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
