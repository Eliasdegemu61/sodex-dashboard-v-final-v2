'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTokenImageUrl, getTokenLogoFallback } from '@/lib/token-images'
import Image from 'next/image'

interface Volume24hData {
  spotVolume24h: string
  futuresVolume24h: string
  totalVolume24h: string
  top3SpotTokens: Array<{
    name: string
    volume: string
    image?: string
  }>
  top3FuturesTokens: Array<{
    name: string
    volume: string
    image?: string
  }>
}

function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (n === 0) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}

export function Volume24h() {
  const [data, setData] = useState<Volume24hData | null>(null)
  const [loading, setLoading] = useState(true)
  const imagesInitiated = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // First effect: Fetch volume data FAST without waiting for images
  useEffect(() => {
    const fetchVolume24h = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/perps/volume-24h')
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`)
        }
        const volumeData = await res.json()
        
        // Set data WITHOUT images first to render quickly
        setData(volumeData)
      } catch (error) {
        console.error('[v0] Error fetching 24h volume:', error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchVolume24h()
    // Refresh every 6 hours
    intervalRef.current = setInterval(fetchVolume24h, 6 * 60 * 60 * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Second effect: Load images AFTER initial render
  useEffect(() => {
    if (imagesInitiated.current || !data) return
    imagesInitiated.current = true

    const loadImages = async () => {
      try {
        // Fetch token images for spot tokens
        const spotWithImages = await Promise.all(
          (data.top3SpotTokens || []).map(async (token: any) => {
            const image = await getTokenImageUrl(token.name)
            return { ...token, image }
          })
        )
        
        // Fetch token images for futures tokens
        const futuresWithImages = await Promise.all(
          (data.top3FuturesTokens || []).map(async (token: any) => {
            const image = await getTokenImageUrl(token.name)
            return { ...token, image }
          })
        )
        
        setData((prev) => prev ? {
          ...prev,
          top3SpotTokens: spotWithImages,
          top3FuturesTokens: futuresWithImages,
        } : null)
      } catch (error) {
        console.error('[v0] Error loading token images:', error)
      }
    }

    loadImages()
  }, [data])

  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Trading Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Trading Volume</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Volume */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Volume</p>
          <p className="text-2xl font-bold">${formatNumber(data.totalVolume24h)}</p>
        </div>

        {/* Spot vs Futures */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Spot Volume</p>
            <p className="text-lg font-semibold">${formatNumber(data.spotVolume24h)}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Futures Volume</p>
            <p className="text-lg font-semibold">${formatNumber(data.futuresVolume24h)}</p>
          </div>
        </div>

        {/* Top 3 Tokens - Side by Side on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 3 Spot Tokens */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Top 3 Spot</p>
            <div className="space-y-2">
              {data.top3SpotTokens.map((token, index) => {
                const fallbackColor = getTokenLogoFallback(token.name)
                
                return (
                  <div
                    key={`spot-${token.name}`}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground w-5 flex-shrink-0">{index + 1}.</span>
                      {token.image ? (
                        <Image
                          src={token.image || "/placeholder.svg"}
                          alt={token.name}
                          width={20}
                          height={20}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${fallbackColor} text-white text-[10px] font-bold`}>
                          {token.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-muted-foreground truncate">{token.name}</span>
                    </div>
                    <span className="font-semibold flex-shrink-0 ml-2">${formatNumber(token.volume)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top 3 Futures Tokens */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Top 3 Futures</p>
            <div className="space-y-2">
              {data.top3FuturesTokens.map((token, index) => {
                const fallbackColor = getTokenLogoFallback(token.name)
                
                return (
                  <div
                    key={`futures-${token.name}`}
                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-muted-foreground w-5 flex-shrink-0">{index + 1}.</span>
                      {token.image ? (
                        <Image
                          src={token.image || "/placeholder.svg"}
                          alt={token.name}
                          width={20}
                          height={20}
                          className="rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${fallbackColor} text-white text-[10px] font-bold`}>
                          {token.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-muted-foreground truncate">{token.name}</span>
                    </div>
                    <span className="font-semibold flex-shrink-0 ml-2">${formatNumber(token.volume)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
