'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PositionHistory {
  realized_pnl: string
  symbol_name: string
}

interface TradeStatisticsProps {
  history: PositionHistory[]
}

export function TradeStatistics({ history }: TradeStatisticsProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No trade data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate statistics
  const profitableTrades = history.filter(trade => parseFloat(trade.realized_pnl) > 0)
  const losingTrades = history.filter(trade => parseFloat(trade.realized_pnl) < 0)

  const totalProfitTrades = profitableTrades.length
  const totalLosingTrades = losingTrades.length
  const totalTrades = history.length

  const avgProfitPerWin = totalProfitTrades > 0
    ? profitableTrades.reduce((sum, trade) => sum + parseFloat(trade.realized_pnl), 0) / totalProfitTrades
    : 0

  const avgLossPerLoss = totalLosingTrades > 0
    ? Math.abs(losingTrades.reduce((sum, trade) => sum + parseFloat(trade.realized_pnl), 0) / totalLosingTrades)
    : 0

  const winRate = parseFloat(((totalProfitTrades / totalTrades) * 100).toFixed(1))
  const lossRate = parseFloat(((totalLosingTrades / totalTrades) * 100).toFixed(1))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Circular Win Rate Indicator - Hidden on Mobile */}
          <div className="hidden md:flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Background circle */}
              <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted-foreground/20"
                />
                {/* Progress circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${(winRate / 100) * (2 * Math.PI * 90)} ${2 * Math.PI * 90}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
                />
              </svg>
              {/* Center text */}
              <div className="text-center z-10">
                <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{winRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Profit Rate</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-lg font-semibold text-foreground">{totalProfitTrades} Winning Trades</p>
              <p className="text-sm text-muted-foreground">out of {totalTrades} total</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
            {/* Wins Card */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-2 md:p-4 hover:shadow-md transition-shadow">
              <p className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-400">Wins</p>
              <p className="text-lg md:text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">{totalProfitTrades}</p>
              <p className="text-sm md:text-lg font-semibold text-emerald-600 dark:text-emerald-500 mt-0.5 md:mt-1">{winRate}%</p>
            </div>

            {/* Losses Card */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2 md:p-4 hover:shadow-md transition-shadow">
              <p className="text-xs md:text-sm font-semibold text-red-700 dark:text-red-400">Losses</p>
              <p className="text-lg md:text-3xl font-bold text-red-600 dark:text-red-500 mt-1">{totalLosingTrades}</p>
              <p className="text-sm md:text-lg font-semibold text-red-600 dark:text-red-500 mt-0.5 md:mt-1">{lossRate}%</p>
            </div>

            {/* Avg Win */}
            <div className="bg-background border border-border rounded-lg p-2 md:p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Win</p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1 md:mt-2">${avgProfitPerWin.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">per profitable trade</p>
            </div>

            {/* Avg Loss */}
            <div className="bg-background border border-border rounded-lg p-2 md:p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Loss</p>
              <p className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-500 mt-1 md:mt-2">${avgLossPerLoss.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">per losing trade</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
