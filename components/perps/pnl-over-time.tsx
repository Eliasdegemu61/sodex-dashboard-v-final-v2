'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useIsMobile } from '@/hooks/use-mobile'

interface PositionHistory {
  position_id: string
  symbol_name: string
  realized_pnl: string
  created_at: number
  updated_at: number
}

interface PnLOverTimeProps {
  history: PositionHistory[]
}

export function PnLOverTime({ history }: PnLOverTimeProps) {
  const isMobile = useIsMobile()
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PnL Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No position history available</p>
        </CardContent>
      </Card>
    )
  }

  // Sort history by close time and calculate cumulative PnL
  const sortedHistory = [...history].sort((a, b) => a.updated_at - b.updated_at)
  
  let cumulativePnL = 0
  const chartData = sortedHistory.map((trade, index) => {
    cumulativePnL += parseFloat(trade.realized_pnl || '0')
    // updated_at is in milliseconds already, no need to multiply by 1000
    const date = new Date(trade.updated_at)
    return {
      timestamp: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      pnl: Math.round(cumulativePnL * 100) / 100,
      tradeIndex: index + 1,
      uniqueId: index,
    }
  })

  // Calculate some statistics
  const finalPnL = cumulativePnL
  const maxDrawdown = calculateMaxDrawdown(sortedHistory)
  const minPnL = Math.min(...chartData.map(d => d.pnl))
  const maxPnL = Math.max(...chartData.map(d => d.pnl))

  return (
    <div className="space-y-6 select-none">
      <Card className="select-none outline-none focus:outline-none active:outline-none">
        <CardHeader>
          <CardTitle>Cumulative PnL Over Time</CardTitle>
        </CardHeader>
        <CardContent className="select-none">
          <div className="w-full h-40 sm:h-80 select-none outline-none focus:outline-none active:outline-none [&_svg]:select-none [&_svg]:outline-none [&_svg]:focus:outline-none [&_svg]:active:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnlGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorPnlLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                {!isMobile && (
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                )}
                {!isMobile && (
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={35}
                  />
                )}
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(2) : value}`, 'Cumulative PnL']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0 && payload[0].payload) {
                      return payload[0].payload.fullDate
                    }
                    return label
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke={finalPnL >= 0 ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill={finalPnL >= 0 ? 'url(#colorPnlGain)' : 'url(#colorPnlLoss)'}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Final PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${finalPnL >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
              ${finalPnL.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              {finalPnL >= 0 ? 'Profitable' : 'Loss'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-500">
              ${maxDrawdown.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Peak to trough</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Highest PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-500">
              ${maxPnL.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Peak value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Lowest PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 dark:text-red-500">
              ${minPnL.toFixed(2)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Lowest point</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function calculateMaxDrawdown(history: PositionHistory[]) {
  if (history.length === 0) return 0
  
  const sortedHistory = [...history].sort((a, b) => a.updated_at - b.updated_at)
  
  let cumulativePnL = 0
  let peak = 0
  let maxDrawdown = 0
  
  sortedHistory.forEach((trade) => {
    cumulativePnL += parseFloat(trade.realized_pnl || '0')
    
    if (cumulativePnL > peak) {
      peak = cumulativePnL
    }
    
    const drawdown = peak - cumulativePnL
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })
  
  return maxDrawdown
}
