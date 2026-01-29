import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://mainnet-gw.sodex.dev/futures/fapi/user/v1/public/account/details?accountId=${accountId}`
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching account details:', error)
    return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 })
  }
}
