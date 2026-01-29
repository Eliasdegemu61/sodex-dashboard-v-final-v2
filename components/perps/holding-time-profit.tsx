'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface PositionHistory {
  position_id: string
  symbol_name: string
  created_at: number
  updated_at: number
  realized_pnl: string
  avg_entry_price: string
  avg_close_price: string
  cum_closed_size: string
  cum_trading_fee: string
}

interface HoldingTimeProfitProps {
  history: PositionHistory[]
}

export function HoldingTimeProfit({ history }: HoldingTimeProfitProps) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []

    return history
      .map((position) => {
        const entryTime = position.created_at
        const exitTime = position.updated_at

        if (!entryTime || !exitTime) return null

        // Convert to milliseconds if needed
        let exitTimestamp = exitTime
        let entryTimestamp = entryTime
        if (exitTimestamp < 10000000000) exitTimestamp *= 1000
        if (entryTimestamp < 10000000000) entryTimestamp *= 1000

        // Calculate holding time in hours
        const holdingTimeMs = exitTimestamp - entryTimestamp
        const holdingTimeHours = holdingTimeMs / (1000 * 60 * 60)

        const pnl = parseFloat(position.realized_pnl) || 0

        // Only include trades with valid data
        if (holdingTimeHours < 0 || holdingTimeHours > 10000 || !isFinite(holdingTimeHours)) return null

        return {
          holdingTime: Math.round(holdingTimeHours * 10) / 10,
          profit: Math.round(pnl * 100) / 100,
          isProfit: pnl > 0,
        }
      })
      .filter(Boolean) as Array<{
        holdingTime: number
        profit: number
        isProfit: boolean
      }>
  }, [history])

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { profitableTrades: 0, avgHoldingTime: 0, avgProfit: 0 }
    }

    const profitable = chartData.filter((d) => d.isProfit)
    const avgHoldingTime = Math.round((chartData.reduce((sum, d) => sum + d.holdingTime, 0) / chartData.length) * 10) / 10
    const avgProfit = Math.round((chartData.reduce((sum, d) => sum + d.profit, 0) / chartData.length) * 100) / 100
    const profitablePercentage = Math.round((profitable.length / chartData.length) * 100)

    return { profitable: profitable.length, avgHoldingTime, avgProfit, profitablePercentage }
  }, [chartData])

  return (
    <Card className="p-4 sm:p-6 select-none outline-none focus:outline-none active:outline-none">
      <div className="space-y-6 select-none">
        {/* Title and Stats */}
        <div>
          <h3 className="text-sm sm:text-lg font-semibold mb-4">Holding Time vs Profit</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="bg-secondary/50 rounded p-2 sm:p-3">
              <p className="text-muted-foreground font-medium uppercase tracking-wide">Trades</p>
              <p className="text-base sm:text-lg font-bold">{chartData.length}</p>
            </div>
            <div className="bg-secondary/50 rounded p-2 sm:p-3">
              <p className="text-muted-foreground font-medium uppercase tracking-wide">Profitable</p>
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-500">{stats.profitablePercentage}%</p>
            </div>
            <div className="bg-secondary/50 rounded p-2 sm:p-3">
              <p className="text-muted-foreground font-medium uppercase tracking-wide">Avg Hold</p>
              <p className="text-base sm:text-lg font-bold">{stats.avgHoldingTime}h</p>
            </div>
            <div className="bg-secondary/50 rounded p-2 sm:p-3">
              <p className="text-muted-foreground font-medium uppercase tracking-wide">Avg P&L</p>
              <p className={`text-base sm:text-lg font-bold ${stats.avgProfit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                ${stats.avgProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="select-none outline-none focus:outline-none active:outline-none [&_svg]:select-none [&_svg]:outline-none [&_svg]:focus:outline-none [&_svg]:active:outline-none">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              data={chartData}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis
                type="number"
                dataKey="holdingTime"
                name="Holding Time (hours)"
                stroke="currentColor"
                opacity={0.5}
                style={{ fontSize: '12px' }}
                label={{ value: 'Holding Time (hours)', position: 'insideBottomRight', offset: -5, style: { fontSize: '12px' } }}
              />
              <YAxis
                type="number"
                dataKey="profit"
                name="Profit ($)"
                stroke="currentColor"
                opacity={0.5}
                style={{ fontSize: '12px' }}
                label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '8px',
                }}
                formatter={(value: number) => {
                  if (typeof value === 'number') {
                    return [value.toFixed(2), '']
                  }
                  return value
                }}
                labelFormatter={(label) => `Holding: ${label}h`}
              />
              <ReferenceLine y={0} stroke="currentColor" opacity={0.2} strokeDasharray="3 3" />
              <Scatter
                name="Profitable Trades"
                data={chartData.filter((d) => d.isProfit)}
                fill="hsl(134, 61%, 50%)"
                opacity={0.7}
              />
              <Scatter
                name="Loss Trades"
                data={chartData.filter((d) => !d.isProfit)}
                fill="hsl(0, 84%, 60%)"
                opacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs sm:text-sm justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Profitable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Loss</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
