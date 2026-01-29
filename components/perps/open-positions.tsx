'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

interface Position {
  symbol: string
  positionId: string
  positionType: string
  positionSide: string
  positionSize: string
  entryPrice: string
  liquidationPrice: string
  isolatedMargin: string
  unrealizedProfit: string
  leverage: number
}

interface OpenPositionsProps {
  positions: Position[]
}

const formatNumber = (num: string | number) => {
  const parsed = parseFloat(String(num))
  if (isNaN(parsed)) return '0.00'
  if (parsed >= 1000000) return (parsed / 1000000).toFixed(2) + 'M'
  if (parsed >= 1000) return (parsed / 1000).toFixed(2) + 'K'
  return parsed.toFixed(4)
}

export function OpenPositions({ positions }: OpenPositionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!positions || positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No open positions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted-foreground">
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-left py-2 px-2">Side</th>
                <th className="text-right py-2 px-2">Size</th>
                <th className="text-right py-2 px-2">Entry Price</th>
                <th className="text-right py-2 px-2">Liq Price</th>
                <th className="text-right py-2 px-2">Margin</th>
                <th className="text-right py-2 px-2">Unrealized PnL</th>
                <th className="text-right py-2 px-2">Leverage</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.positionId} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 font-mono font-semibold">{pos.symbol}</td>
                  <td className="py-3 px-2">
                    <span className={pos.positionSide === 'LONG' ? 'text-success' : 'text-destructive'}>
                      {pos.positionSide}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">{formatNumber(pos.positionSize)}</td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.entryPrice)}</td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.liquidationPrice)}</td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.isolatedMargin)}</td>
                  <td className={`text-right py-3 px-2 ${parseFloat(pos.unrealizedProfit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${formatNumber(pos.unrealizedProfit)}
                  </td>
                  <td className="text-right py-3 px-2">{pos.leverage}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {positions.map((pos) => (
            <div key={pos.positionId} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === pos.positionId ? null : pos.positionId)}
                className="w-full bg-card hover:bg-secondary/50 transition-colors p-4 flex items-center justify-between"
              >
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{pos.symbol}</p>
                    <span className={`text-xs font-medium ${pos.positionSide === 'LONG' ? 'text-success' : 'text-destructive'}`}>
                      {pos.positionSide}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Size: {formatNumber(pos.positionSize)}</p>
                  <p className={`text-sm font-semibold ${parseFloat(pos.unrealizedProfit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${formatNumber(pos.unrealizedProfit)}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === pos.positionId ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedId === pos.positionId && (
                <div className="bg-background/50 p-4 border-t border-border space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Entry Price</p>
                      <p className="font-semibold">${formatNumber(pos.entryPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Liq Price</p>
                      <p className="font-semibold">${formatNumber(pos.liquidationPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margin</p>
                      <p className="font-semibold">${formatNumber(pos.isolatedMargin)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Leverage</p>
                      <p className="font-semibold">{pos.leverage}x</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
