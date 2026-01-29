import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  try {
    const allPositions: any[] = []
    let cursor: string | null = null
    let pageCount = 0
    const maxPages = 10

    while (pageCount < maxPages) {
      let url = `https://mainnet-data.sodex.dev/api/v1/perps/positions?account_id=${accountId}&limit=1000`
      
      if (pageCount === 0) {
        // First request uses page=1
        url += `&page=1`
      } else if (cursor) {
        // Subsequent requests use cursor
        url += `&cursor=${cursor}`
      }

      console.log('[v0] History API - Fetching page', pageCount + 1, 'with URL:', url)

      const response = await fetch(url)
      const data = await response.json()
      
      // Extract positions and cursor from response
      const positions = data.data && Array.isArray(data.data) ? data.data : []
      const nextCursor = data.meta?.next_cursor || null
      
      allPositions.push(...positions)
      console.log('[v0] History API - Page', pageCount + 1, 'returned', positions.length, 'positions. Total so far:', allPositions.length)
      console.log('[v0] History API - Next cursor:', nextCursor || 'NO CURSOR - end of data')
      
      if (!nextCursor) {
        console.log('[v0] History API - No more pages available')
        break
      }

      cursor = nextCursor
      pageCount++
    }

    console.log('[v0] History API - Final total positions:', allPositions.length)
    
    return NextResponse.json(allPositions)
  } catch (error) {
    console.error('Error fetching position history:', error)
    return NextResponse.json({ error: 'Failed to fetch position history' }, { status: 500 })
  }
}
