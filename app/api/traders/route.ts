import { NextResponse } from 'next/server'

const GITHUB_URL = 'https://raw.githubusercontent.com/eliasdegemu61/sodexmain/main/sodex_data.json'
// Reduced cache to 15 minutes for more frequent updates
const CACHE_DURATION = 15 * 60 * 1000

let cachedData = null
let cacheTime = 0
let lastGitHubFetch = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  
  const now = Date.now()

  // Skip cache if refresh is requested
  if (!forceRefresh && cachedData && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData,
      cached: true,
      cacheAge: Math.round((now - cacheTime) / 60000),
      lastGitHubFetch: new Date(lastGitHubFetch).toLocaleString(),
    })
  }

  try {
    const response = await fetch(GITHUB_URL)
    const data = await response.json()

    cachedData = data
    cacheTime = now
    lastGitHubFetch = now

    return NextResponse.json({
      ...data,
      cached: false,
      cacheAge: 0,
      lastGitHubFetch: new Date(lastGitHubFetch).toLocaleString(),
    })
  } catch (error) {
    console.error('Failed to fetch GitHub data:', error)
    
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
        stale: true,
        cacheAge: Math.round((now - cacheTime) / 60000),
        lastGitHubFetch: new Date(lastGitHubFetch).toLocaleString(),
      })
    }

    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
