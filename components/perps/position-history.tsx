'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface PositionHistory {
  position_id: string
  symbol_id?: number
  symbol_name: string
  margin_mode: number
  position_side: number
  avg_entry_price: string
  cum_trading_fee: string
  cum_closed_size: string
  avg_close_price: string
  realized_pnl: string
  leverage: number
  created_at: number
  updated_at: number
}

interface PositionHistoryProps {
  history: PositionHistory[]
}

const formatNumber = (num: string | number) => {
  const parsed = parseFloat(String(num))
  if (isNaN(parsed)) return '0.00'
  if (parsed >= 1000000) return (parsed / 1000000).toFixed(2) + 'M'
  if (parsed >= 1000) return (parsed / 1000).toFixed(2) + 'K'
  return parsed.toFixed(4)
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getMarginMode = (mode: number) => {
  return mode === 1 ? 'Isolated' : 'Cross'
}

const getPositionSide = (side: number) => {
  return side === 2 ? 'Long' : 'Short'
}

export function PositionHistory({ history }: PositionHistoryProps) {
  const [showAll, setShowAll] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const INITIAL_DISPLAY = 200

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Position History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No position history</p>
        </CardContent>
      </Card>
    )
  }

  const displayedHistory = showAll ? history : history.slice(0, INITIAL_DISPLAY)
  const hasMore = history.length > INITIAL_DISPLAY

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position History ({history.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted-foreground">
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Side</th>
                <th className="text-right py-2 px-2">Entry Price</th>
                <th className="text-right py-2 px-2">Close Price</th>
                <th className="text-right py-2 px-2">Size Closed</th>
                <th className="text-right py-2 px-2">Trading Fee</th>
                <th className="text-right py-2 px-2">Realized PnL</th>
                <th className="text-right py-2 px-2">Leverage</th>
                <th className="text-left py-2 px-2">Closed</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistory.map((pos) => (
                <tr key={pos.position_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 font-mono font-semibold">{pos.symbol_name}</td>
                  <td className="py-3 px-2">{getMarginMode(pos.margin_mode)}</td>
                  <td className="py-3 px-2">
                    <span className={getPositionSide(pos.position_side) === 'Long' ? 'text-success' : 'text-destructive'}>
                      {getPositionSide(pos.position_side)}
                    </span>
                  </td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.avg_entry_price)}</td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.avg_close_price)}</td>
                  <td className="text-right py-3 px-2">{formatNumber(pos.cum_closed_size)}</td>
                  <td className="text-right py-3 px-2">${formatNumber(pos.cum_trading_fee)}</td>
                  <td className={`text-right py-3 px-2 ${parseFloat(pos.realized_pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${formatNumber(pos.realized_pnl)}
                  </td>
                  <td className="text-right py-3 px-2">{pos.leverage}x</td>
                  <td className="text-left py-3 px-2 text-xs">{formatDate(pos.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {displayedHistory.map((pos) => (
            <div key={pos.position_id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === pos.position_id ? null : pos.position_id)}
                className="w-full bg-card hover:bg-secondary/50 transition-colors p-4 flex items-center justify-between"
              >
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{pos.symbol_name}</p>
                    <span className={`text-xs font-medium ${getPositionSide(pos.position_side) === 'Long' ? 'text-success' : 'text-destructive'}`}>
                      {getPositionSide(pos.position_side)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Size: {formatNumber(pos.cum_closed_size)}</p>
                  <p className={`text-sm font-semibold ${parseFloat(pos.realized_pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${formatNumber(pos.realized_pnl)}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === pos.position_id ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedId === pos.position_id && (
                <div className="bg-background/50 p-4 border-t border-border space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Entry Price</p>
                      <p className="font-semibold">${formatNumber(pos.avg_entry_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Close Price</p>
                      <p className="font-semibold">${formatNumber(pos.avg_close_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trading Fee</p>
                      <p className="font-semibold">${formatNumber(pos.cum_trading_fee)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Leverage</p>
                      <p className="font-semibold">{pos.leverage}x</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-semibold">{getMarginMode(pos.margin_mode)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Closed</p>
                      <p className="font-semibold text-xs">{formatDate(pos.updated_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasMore && !showAll && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="w-full"
            >
              View All ({history.length - INITIAL_DISPLAY} more)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
