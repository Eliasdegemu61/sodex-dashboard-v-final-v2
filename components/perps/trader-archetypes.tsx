'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface TraderArchetypeProps {
  history: PositionHistory[]
  balance?: string
}

interface Metrics {
  TOTAL_TRADES: number // Total closed positions
  ACTIVE_DAYS: number // Number of active days
  TPD: number // Trades per day
  TOTAL_PNL: number // Sum of realized PnL
  TOTAL_FEES: number // Sum of fees
  FEE_BURN: number // Fee burn ratio (fees / |pnl|)
  WIN_RATE: number // Win rate (wins / total trades)
  AVG_PNL: number // Average PnL per trade
  AVG_HOLD: number // Average holding time in minutes
  RISK_SCORE: number // Risk score (avg exposure / balance)
  SIZE_VARIANCE: number // Position size variance (stddev / mean)
  TIME_VARIANCE: number // Holding time variance (stddev / mean)
  MAX_DRAWDOWN: number // Max drawdown percentage
  DIRECTION_FLIP: number // Direction flip ratio
  TOTAL_VOLUME: number // Total trading volume
  PNL_TO_VOLUME: number // |PNL| / Volume ratio
}

interface ArchetypeResult {
  archetype: string
  icon: string
  color: string
  skill: number
  discipline: number
  efficiency: number
  risk: number
  description: string
}

const calculateMetrics = (history: PositionHistory[], balance: number): Metrics => {
  if (history.length === 0) {
    return {
      TOTAL_TRADES: 0,
      ACTIVE_DAYS: 0,
      TPD: 0,
      TOTAL_PNL: 0,
      TOTAL_FEES: 0,
      FEE_BURN: 0,
      WIN_RATE: 0,
      AVG_PNL: 0,
      AVG_HOLD: 0,
      RISK_SCORE: 0,
      SIZE_VARIANCE: 0,
      TIME_VARIANCE: 0,
      MAX_DRAWDOWN: 0,
      DIRECTION_FLIP: 0,
      TOTAL_VOLUME: 0,
      PNL_TO_VOLUME: 0,
    }
  }

  const TOTAL_TRADES = history.length

  // Calculate holding times
  const holdingTimes = history.map(h => {
    const diffMs = h.updated_at - h.created_at
    return diffMs / (1000 * 60) // Convert to minutes
  })
  const AVG_HOLD = holdingTimes.reduce((a, b) => a + b, 0) / TOTAL_TRADES

  // Calculate time variance
  const holdingMean = AVG_HOLD
  const holdingStdDev = Math.sqrt(
    holdingTimes.reduce((sum, h) => sum + Math.pow(h - holdingMean, 2), 0) / TOTAL_TRADES
  )
  const TIME_VARIANCE = holdingMean > 0 ? holdingStdDev / holdingMean : 0

  // Calculate active days
  const uniqueDays = new Set(
    history.map(h => new Date(h.created_at * 1000).toDateString())
  )
  const ACTIVE_DAYS = Math.max(uniqueDays.size, 1)
  const TPD = TOTAL_TRADES / ACTIVE_DAYS

  // Calculate PnL and fees
  const TOTAL_PNL = history.reduce((sum, h) => sum + parseFloat(h.realized_pnl || '0'), 0)
  const TOTAL_FEES = history.reduce((sum, h) => sum + parseFloat(h.cum_trading_fee || '0'), 0)
  const FEE_BURN = TOTAL_FEES / Math.max(Math.abs(TOTAL_PNL), 1)
  const AVG_PNL = TOTAL_PNL / TOTAL_TRADES

  // Calculate win rate
  const winningPositions = history.filter(h => parseFloat(h.realized_pnl || '0') > 0).length
  const WIN_RATE = winningPositions / TOTAL_TRADES

  // Calculate position sizes and risk
  const positionSizes = history.map(h => parseFloat(h.cum_closed_size || '0') * parseFloat(h.avg_entry_price || '1') * h.leverage)
  const sizeMean = positionSizes.reduce((a, b) => a + b, 0) / TOTAL_TRADES
  const sizeStdDev = Math.sqrt(
    positionSizes.reduce((sum, s) => sum + Math.pow(s - sizeMean, 2), 0) / TOTAL_TRADES
  )
  const SIZE_VARIANCE = sizeMean > 0 ? sizeStdDev / sizeMean : 0
  const RISK_SCORE = balance > 0 ? sizeMean / balance : 0

  // Calculate direction flips per symbol
  const symbolHistory: Record<string, number[]> = {}
  history.forEach(h => {
    if (!symbolHistory[h.symbol_name]) {
      symbolHistory[h.symbol_name] = []
    }
    symbolHistory[h.symbol_name].push(h.position_side)
  })

  let totalFlips = 0
  let flipOpportunities = 0
  Object.values(symbolHistory).forEach(sides => {
    for (let i = 1; i < sides.length; i++) {
      if (sides[i] !== sides[i - 1]) {
        totalFlips++
      }
      flipOpportunities++
    }
  })
  const DIRECTION_FLIP = flipOpportunities > 0 ? totalFlips / flipOpportunities : 0

  // Calculate max drawdown
  let cumulativeReturn = 0
  let maxCumulative = 0
  let maxDrawdown = 0
  history.forEach(h => {
    cumulativeReturn += parseFloat(h.realized_pnl || '0')
    maxCumulative = Math.max(maxCumulative, cumulativeReturn)
    maxDrawdown = Math.max(maxDrawdown, maxCumulative - cumulativeReturn)
  })
  const MAX_DRAWDOWN = balance > 0 ? maxDrawdown / balance : 0

  // Calculate volume
  const TOTAL_VOLUME = history.reduce((sum, h) => {
    const size = parseFloat(h.cum_closed_size || '0')
    const price = (parseFloat(h.avg_entry_price || '0') + parseFloat(h.avg_close_price || '0')) / 2
    return sum + (size * price)
  }, 0)

  const PNL_TO_VOLUME = TOTAL_VOLUME > 0 ? Math.abs(TOTAL_PNL) / TOTAL_VOLUME : 0

  return {
    TOTAL_TRADES,
    ACTIVE_DAYS,
    TPD,
    TOTAL_PNL,
    TOTAL_FEES,
    FEE_BURN,
    WIN_RATE,
    AVG_PNL,
    AVG_HOLD,
    RISK_SCORE,
    SIZE_VARIANCE,
    TIME_VARIANCE,
    MAX_DRAWDOWN,
    DIRECTION_FLIP,
    TOTAL_VOLUME,
    PNL_TO_VOLUME,
  }
}

const classifyArchetype = (metrics: Metrics): ArchetypeResult => {
  // Alpha Trader: TOTAL_PNL > 0, WIN_RATE >= 0.60, FEE_BURN <= 0.30, AVG_HOLD >= 30 min, RISK_SCORE <= 0.25
  if (
    metrics.TOTAL_PNL > 0 &&
    metrics.WIN_RATE >= 0.6 &&
    metrics.FEE_BURN <= 0.3 &&
    metrics.AVG_HOLD >= 30 &&
    metrics.RISK_SCORE <= 0.25
  ) {
    return {
      archetype: 'Alpha Trader',
      icon: '',
      color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'Consistent profitable trader with strong risk management and discipline',
    }
  }

  // Scalper: AVG_HOLD <= 20 min, TPD >= 10, FEE_BURN between 0.30 and 0.80, WIN_RATE >= 0.45
  if (
    metrics.AVG_HOLD <= 20 &&
    metrics.TPD >= 10 &&
    metrics.FEE_BURN >= 0.3 &&
    metrics.FEE_BURN <= 0.8 &&
    metrics.WIN_RATE >= 0.45
  ) {
    return {
      archetype: 'Scalper',
      icon: '',
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'Fast trader capturing small frequent moves with high trading frequency',
    }
  }

  // Overtrader (Fee Farmer): TPD >= 15, AVG_HOLD <= 15 min, FEE_BURN >= 1.0, TOTAL_FEES >= TOTAL_PNL
  if (
    metrics.TPD >= 15 &&
    metrics.AVG_HOLD <= 15 &&
    metrics.FEE_BURN >= 1.0 &&
    metrics.TOTAL_FEES >= metrics.TOTAL_PNL
  ) {
    return {
      archetype: 'Overtrader',
      icon: '',
      color: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'Excessive trading with fees consuming profits - consider reducing trade frequency',
    }
  }

  // Swing Trader: AVG_HOLD >= 240 min (4 hours), TPD <= 3, AVG_PNL >= 0.5% of balance, WIN_RATE >= 0.50
  if (
    metrics.AVG_HOLD >= 240 &&
    metrics.TPD <= 3 &&
    Math.abs(metrics.AVG_PNL) >= 0.005 &&
    metrics.WIN_RATE >= 0.5
  ) {
    return {
      archetype: 'Swing Trader',
      icon: '',
      color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'Patient trader holding positions for hours or days with selective entries',
    }
  }

  // Gambler: RISK_SCORE >= 0.30, MAX_DRAWDOWN >= 0.30, WIN_RATE <= 0.45, FEE_BURN >= 0.60
  if (
    metrics.RISK_SCORE >= 0.3 &&
    metrics.MAX_DRAWDOWN >= 0.3 &&
    metrics.WIN_RATE <= 0.45 &&
    metrics.FEE_BURN >= 0.6
  ) {
    return {
      archetype: 'Gambler',
      icon: '',
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'High-risk, inconsistent trading with significant drawdowns - improve risk management',
    }
  }

  // Bot (Account Farming): SIZE_VARIANCE < 0.05, TIME_VARIANCE < 0.10, TPD >= 20, |TOTAL_PNL| <= 1% of TOTAL_VOLUME
  if (
    metrics.SIZE_VARIANCE < 0.05 &&
    metrics.TIME_VARIANCE < 0.1 &&
    metrics.TPD >= 20 &&
    Math.abs(metrics.TOTAL_PNL) <= 0.01 * metrics.TOTAL_VOLUME
  ) {
    return {
      archetype: 'Bot/Farming',
      icon: '',
      color: 'bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
      skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
      discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
      efficiency: metrics.PNL_TO_VOLUME,
      risk: metrics.RISK_SCORE,
      description: 'Automated or farming account with consistent position sizes and minimal variance',
    }
  }

  // Default: Unclassified
  return {
    archetype: 'Unclassified Trader',
    icon: '',
    color: 'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    skill: Math.min(1, metrics.WIN_RATE * (1 - Math.min(1, metrics.FEE_BURN))),
    discipline: Math.min(1, 1 - metrics.DIRECTION_FLIP),
    efficiency: metrics.PNL_TO_VOLUME,
    risk: metrics.RISK_SCORE,
    description: 'Trading style does not match defined archetypes. Develop a consistent strategy.',
  }
}

const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

const formatMetric = (value: number, type: 'percent' | 'number' | 'time' = 'number') => {
  if (type === 'percent') return formatPercent(value)
  if (type === 'time') return `${value.toFixed(0)} min`
  return value.toFixed(3)
}

export function TraderArchetypes({ history, balance = '0' }: TraderArchetypeProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trader Archetype</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No position history available</p>
        </CardContent>
      </Card>
    )
  }

  const balanceNum = parseFloat(balance || '0')
  const metrics = calculateMetrics(history, balanceNum)
  const archetype = classifyArchetype(metrics)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trader Classification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Archetype Badge and Description */}
        <div className="space-y-3">
          <Badge className={`${archetype.color} border px-3 py-1.5 text-sm font-semibold`}>
            {archetype.archetype}
          </Badge>
          <p className="text-sm text-muted-foreground">{archetype.description}</p>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Skill Score</p>
            <p className="text-lg font-semibold">{formatPercent(Math.max(0, Math.min(1, archetype.skill)))}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Discipline</p>
            <p className="text-lg font-semibold">{formatPercent(Math.max(0, Math.min(1, archetype.discipline)))}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Efficiency</p>
            <p className="text-lg font-semibold">{formatPercent(archetype.efficiency)}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Risk Level</p>
            <p className="text-lg font-semibold">{formatPercent(archetype.risk)}</p>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-semibold">Trading Metrics</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Total Trades</p>
              <p className="font-semibold">{metrics.TOTAL_TRADES}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Win Rate</p>
              <p className="font-semibold">{formatPercent(metrics.WIN_RATE)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Avg Holding Time</p>
              <p className="font-semibold">{formatMetric(metrics.AVG_HOLD, 'time')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Trades Per Day</p>
              <p className="font-semibold">{metrics.TPD.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Fee Burn Ratio</p>
              <p className="font-semibold">{metrics.FEE_BURN.toFixed(2)}x</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Active Days</p>
              <p className="font-semibold">{metrics.ACTIVE_DAYS}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Drawdown</p>
              <p className="font-semibold">{formatPercent(metrics.MAX_DRAWDOWN)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Direction Flips</p>
              <p className="font-semibold">{formatPercent(metrics.DIRECTION_FLIP)}</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total PnL</span>
            <span className={`font-semibold ${metrics.TOTAL_PNL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${metrics.TOTAL_PNL.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Fees</span>
            <span className="font-semibold">${metrics.TOTAL_FEES.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Volume</span>
            <span className="font-semibold">${(metrics.TOTAL_VOLUME / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
