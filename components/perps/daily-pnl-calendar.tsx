'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DayPnL {
  date: string
  pnl: number
  trades: any[]
  winRate?: number
}

interface DailyPnLCalendarProps {
  history: any[]
}

export function DailyPnLCalendar({ history }: DailyPnLCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTrades, setSelectedTrades] = useState<any[]>([])
  const [displayMonth, setDisplayMonth] = useState(new Date())

  const dailyPnL = useMemo(() => {
    const pnlData: Record<string, DayPnL> = {}

    history.forEach(trade => {
      const dateField = trade.updated_at
      if (!dateField) return

      let timestamp = dateField
      if (timestamp < 10000000000) {
        timestamp = timestamp * 1000
      }

      try {
        const tradeDate = new Date(timestamp).toISOString().split('T')[0]
        const year = new Date(timestamp).getFullYear()
        if (year < 2020 || year > 2030) return
        
        if (!pnlData[tradeDate]) {
          pnlData[tradeDate] = {
            date: tradeDate,
            pnl: 0,
            trades: [],
            winRate: 0,
          }
        }
        pnlData[tradeDate].pnl += parseFloat(trade.realized_pnl || '0')
        pnlData[tradeDate].trades.push(trade)
      } catch (e) {
        // Skip invalid dates
      }
    })

    // Calculate win rate for each day
    Object.entries(pnlData).forEach(([_, dayData]) => {
      const winTrades = dayData.trades.filter(t => parseFloat(t.realized_pnl || '0') > 0).length
      dayData.winRate = dayData.trades.length > 0 ? (winTrades / dayData.trades.length) * 100 : 0
    })

    return pnlData
  }, [history])

  const monthStats = useMemo(() => {
    const currentYear = displayMonth.getFullYear()
    const currentMonth = displayMonth.getMonth()
    
    let totalPnL = 0
    let winDays = 0
    let lossDays = 0
    let totalTrades = 0

    Object.entries(dailyPnL).forEach(([date, data]) => {
      const dateObj = new Date(date)
      if (dateObj.getFullYear() === currentYear && dateObj.getMonth() === currentMonth) {
        totalPnL += data.pnl
        if (data.pnl > 0) winDays++
        else if (data.pnl < 0) lossDays++
        totalTrades += data.trades.length
      }
    })

    return { totalPnL, winDays, lossDays, totalTrades }
  }, [dailyPnL, displayMonth])

  const currentYear = displayMonth.getFullYear()
  const currentMonth = displayMonth.getMonth()

  const firstDay = new Date(currentYear, currentMonth, 1)
  const lastDay = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push(dateStr)
  }

  const handleDayClick = (dateStr: string | null) => {
    if (!dateStr) return
    const dayData = dailyPnL[dateStr]
    if (dayData) {
      setSelectedDate(dateStr)
      setSelectedTrades(dayData.trades)
    }
  }

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(currentYear, currentMonth - 1))
  }

  const handleNextMonth = () => {
    setDisplayMonth(new Date(currentYear, currentMonth + 1))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDateOpacity = (pnl: number) => {
    if (pnl === 0) return 'opacity-20'
    const absPnl = Math.abs(pnl)
    const maxPnl = Math.max(...Object.values(dailyPnL).map(d => Math.abs(d.pnl)), 1)
    const opacity = Math.min(0.7, 0.2 + (absPnl / maxPnl) * 0.5)
    return opacity
  }

  const getDateStyle = (pnl: number) => {
    if (pnl > 0) {
      return 'bg-emerald-500/40 dark:bg-emerald-500/30'
    }
    if (pnl < 0) {
      return 'bg-red-500/40 dark:bg-red-500/30'
    }
    return 'bg-slate-400/20 dark:bg-slate-400/15'
  }

  return (
    <Card className="p-4 bg-transparent dark:bg-transparent border-0">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevMonth}
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-secondary"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNextMonth}
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-secondary"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Stats Bars */}
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          <div className="bg-secondary/50 dark:bg-secondary/30 rounded px-1.5 py-1 md:px-2 md:py-1.5">
            <div className="text-[8px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total</div>
            <div className={`text-xs md:text-sm font-semibold ${monthStats.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
              {monthStats.totalPnL >= 0 ? '+' : ''}{monthStats.totalPnL.toFixed(0)}
            </div>
          </div>
          <div className="bg-secondary/50 dark:bg-secondary/30 rounded px-1.5 py-1 md:px-2 md:py-1.5">
            <div className="text-[8px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Wins</div>
            <div className="text-xs md:text-sm font-semibold text-emerald-600 dark:text-emerald-500">{monthStats.winDays}</div>
          </div>
          <div className="bg-secondary/50 dark:bg-secondary/30 rounded px-1.5 py-1 md:px-2 md:py-1.5">
            <div className="text-[8px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Loss</div>
            <div className="text-xs md:text-sm font-semibold text-red-600 dark:text-red-500">{monthStats.lossDays}</div>
          </div>
          <div className="bg-secondary/50 dark:bg-secondary/30 rounded px-1.5 py-1 md:px-2 md:py-1.5">
            <div className="text-[8px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Trades</div>
            <div className="text-xs md:text-sm font-semibold text-muted-foreground">{monthStats.totalTrades}</div>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mt-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {day.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={idx} className="aspect-square" />
            }

            const dayData = dailyPnL[dateStr]
            const pnl = dayData?.pnl || 0
            const day = new Date(dateStr).getDate()
            const isToday = dateStr === new Date().toISOString().split('T')[0]
            const style = dayData ? getDateStyle(pnl) : 'bg-transparent'
            const opacity = dayData ? getDateOpacity(pnl) : ''

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(dateStr)}
                className={`
                  aspect-square rounded text-[9px] font-medium
                  transition-all duration-150
                  ${dayData ? 'cursor-pointer' : ''}
                  ${dayData ? style : ''}
                  ${dayData ? opacity : ''}
                  ${isToday ? 'ring-1 ring-foreground/40' : dayData ? 'hover:ring-1 hover:ring-foreground/20' : ''}
                  text-foreground
                  flex flex-col items-start justify-center gap-0 p-1 relative
                `}
                title={dayData ? `${day}: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)}` : ''}
              >
                <span className="font-semibold text-[8px] absolute top-0.5 left-0.5">{day}</span>
                {dayData && (
                  <span className={`text-center w-full text-xs font-bold ${pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : pnl < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    {pnl > 0 ? '+' : ''}{pnl.toFixed(0)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {selectedDate && (
                <>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {selectedTrades.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      ({selectedTrades.length} position{selectedTrades.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedTrades.length > 0 ? (
            <div className="space-y-2 mt-4">
              {selectedTrades.map((trade, idx) => {
                const pnl = parseFloat(trade.realized_pnl || '0')
                const isProfit = pnl > 0

                return (
                  <div
                    key={idx}
                    className={`rounded p-3 text-sm border ${
                      isProfit
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/20'
                        : 'bg-red-500/10 dark:bg-red-500/10 border-red-500/20 dark:border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {trade.symbol_name || `Symbol-${trade.symbol_id}`}
                      </span>
                      <span className={`font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p className="font-medium">Entry</p>
                        <p>${parseFloat(trade.avg_entry_price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Exit</p>
                        <p>${parseFloat(trade.avg_close_price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Size</p>
                        <p>{parseFloat(trade.cum_closed_size).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Fees</p>
                        <p>${parseFloat(trade.cum_trading_fee).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No trades on this day</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
