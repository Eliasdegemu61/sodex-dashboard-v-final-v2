import { NextResponse } from 'next/server'

let symbolsCache = null
let symbolsCacheTime = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function GET() {
  const now = Date.now()

  if (symbolsCache && now - symbolsCacheTime < CACHE_DURATION) {
    return NextResponse.json(symbolsCache)
  }

  try {
    const response = await fetch('https://mainnet-gw.sodex.dev/bolt/symbols?names')
    const data = await response.json()
    
    symbolsCache = data
    symbolsCacheTime = now
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching symbols:', error)
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 })
  }
}
