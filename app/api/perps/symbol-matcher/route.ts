import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolIds = searchParams.get('ids')

  if (!symbolIds) {
    return NextResponse.json({ error: 'ids parameter required' }, { status: 400 })
  }

  try {
    // Fetch symbols from SoDex API
    const res = await fetch('https://mainnet-gw.sodex.dev/bolt/symbols?names')
    const data = await res.json()

    const symbolMap: Record<string, string> = {}
    const idArray = symbolIds.split(',').map(id => parseInt(id))

    // Handle different response formats
    let symbolsArray = data
    if (data.data) {
      symbolsArray = data.data
    }

    if (Array.isArray(symbolsArray)) {
      symbolsArray.forEach((sym: any) => {
        const id = sym.id || sym.symbolID || sym.symbol_id
        const name = sym.name || sym.symbol_name || sym.displayName
        if (id && name) {
          symbolMap[id.toString()] = name
        }
      })
    }

    // Build response with only requested IDs
    const result: Record<string, string> = {}
    idArray.forEach(id => {
      result[id.toString()] = symbolMap[id.toString()] || `Symbol-${id}`
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching symbol matcher:', error)
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 })
  }
}
