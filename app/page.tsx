'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Search, Menu, X, BarChart3, Target, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Loading from './loading'
import { OpenPositions } from '@/components/perps/open-positions'
import { PositionHistory } from '@/components/perps/position-history'
import { DailyPnLCalendar } from '@/components/perps/daily-pnl-calendar'
import { PnLOverTime } from '@/components/perps/pnl-over-time'
import { TradeStatistics } from '@/components/perps/trade-statistics'
import { TopPairs } from '@/components/perps/top-pairs'
import { Volume24h } from '@/components/perps/volume-24h'
import { HoldingTimeProfit } from '@/components/perps/holding-time-profit'
import { TraderArchetypes } from '@/components/perps/trader-archetypes'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from 'next-themes'

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sorted, setSorted] = useState('pnl')
  const [leaderboardPage, setLeaderboardPage] = useState(0)
  const [rowCount, setRowCount] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('trading')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [perpsLoading, setPerpsLoading] = useState(false)
  const [perpsData, setPerpsData] = useState(null)
  const [perpsSearchInput, setPerpsSearchInput] = useState('')
  const [symbols, setSymbols] = useState<Record<number, string>>({})
  const [walletBalance, setWalletBalance] = useState('0')
  const [users, setUsers] = useState([])
  const [spotBalance, setSpotBalance] = useState('0')
  const [positionHistoryCount, setPositionHistoryCount] = useState(0)
  const [addressError, setAddressError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [positionView, setPositionView] = useState<'open' | 'history' | 'stats'>('open')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showAllPositions, setShowAllPositions] = useState(false)
  const [showAllPositionHistory, setShowAllPositionHistory] = useState(false)
  const [cumulativeVolume, setCumulativeVolume] = useState('0')
  const [cumulativePnl, setCumulativePnl] = useState('0')
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showCustomAnalytics, setShowCustomAnalytics] = useState(false)
  const [customVolumeMin, setCustomVolumeMin] = useState('')
  const [customVolumeMax, setCustomVolumeMax] = useState('')
  const [customPnlMin, setCustomPnlMin] = useState('')
  const [customPnlMax, setCustomPnlMax] = useState('')
  const [pnlFilter, setPnlFilter] = useState<'all' | 'profitable' | 'loss'>('all')
  const [matchingTraders, setMatchingTraders] = useState([])
  const [analyticsRowCount, setAnalyticsRowCount] = useState(10)
  const [analyticsPage, setAnalyticsPage] = useState(0)
  const [dataLastChanged, setDataLastChanged] = useState<string | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showPortfolioBindModal, setShowPortfolioBindModal] = useState(false)
  const [portfolioBoundAddress, setPortfolioBoundAddress] = useState<string | null>(null)
  const [portfolioBindInput, setPortfolioBindInput] = useState('')
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioData, setPortfolioData] = useState(null)
  const [portfolioBalance, setPortfolioBalance] = useState('0')
  const [portfolioSpotBalance, setPortfolioSpotBalance] = useState('0')
  const [portfolioCumulativeVolume, setPortfolioCumulativeVolume] = useState('0')
  const [portfolioCumulativePnl, setPortfolioCumulativePnl] = useState('0')
  const [portfolioError, setPortfolioError] = useState('')
  const [portfolioPositionView, setPortfolioPositionView] = useState<'open' | 'history' | 'stats'>('open')
  const [portfolioHistoryCount, setPortfolioHistoryCount] = useState(0)
  const [showAllPortfolioHistory, setShowAllPortfolioHistory] = useState(false)
  const [spotVolumeUsd, setSpotVolumeUsd] = useState('0')
  const [spotFeesUsd, setSpotFeesUsd] = useState('0')
  const [spotTradesLoading, setSpotTradesLoading] = useState(false)
  const [portfolioSpotVolumeUsd, setPortfolioSpotVolumeUsd] = useState('0')
  const [portfolioSpotFeesUsd, setPortfolioSpotFeesUsd] = useState('0')
  const [portfolioSpotTradesLoading, setPortfolioSpotTradesLoading] = useState(false)
  const [totalSpotVolume, setTotalSpotVolume] = useState('0')
  const [spotVolumeLoading, setSpotVolumeLoading] = useState(false)
  const [totalFuturesVolume, setTotalFuturesVolume] = useState('0')
  const [futuresVolumeLoading, setFuturesVolumeLoading] = useState(false)

  // Load portfolio binding from localStorage and users data
  useEffect(() => {
    const savedPortfolioAddress = localStorage.getItem('portfolioBoundAddress')
    if (savedPortfolioAddress && users.length > 0) {
      setPortfolioBoundAddress(savedPortfolioAddress)
      // Auto-reload the portfolio data after users are loaded
      reloadPortfolioData(savedPortfolioAddress)
    }
  }, [users])

  const reloadPortfolioData = async (address: string) => {
    setPortfolioLoading(true)
    try {
      const lowerQuery = address.toLowerCase()
      let accountId = address

      // If searching by address, find the account ID from users data
      if (address.startsWith('0x')) {
        const user = users.find(u => u.address.toLowerCase().includes(lowerQuery))
        if (!user) {
          setPortfolioError('Address not found in database')
          setPortfolioLoading(false)
          return
        }
        accountId = user.id
      }

      const accountRes = await fetch(`/api/perps/account?accountId=${accountId}`)
      const accountData = await accountRes.json()

      const historyRes = await fetch(`/api/perps/history?accountId=${accountId}`)
      const historyData = await historyRes.json()

      const spotRes = await fetch(`/api/perps/spot-balance?accountId=${accountId}`)
      const spotData = await spotRes.json()

      const volumeRes = await fetch(`/api/perps/volume?accountId=${accountId}`)
      const volumeData = await volumeRes.json()

      const balance = accountData.data?.balances?.[0]?.walletBalance || '0'
      setPortfolioBalance(balance)
      setPortfolioSpotBalance(spotData.totalSpotBalance || '0')
      setPortfolioCumulativeVolume(volumeData.cumulativeVolume || '0')
      setPortfolioCumulativePnl(volumeData.cumulativePnl || '0')

      const positions = accountData.data?.positions?.map((pos: any) => ({
        ...pos,
        symbol: pos.symbol,
      })) || []

      const history = Array.isArray(historyData) ? historyData : []
      const uniqueSymbolIds = Array.from(new Set(history.map((h: any) => h.symbol_id)))
      
      let symbolMap: Record<number, string> = {}
      if (uniqueSymbolIds.length > 0) {
        const matcherRes = await fetch(`/api/perps/symbol-matcher?ids=${uniqueSymbolIds.join(',')}`)
        symbolMap = await matcherRes.json()
      }

      const historyWithSymbols = history.map((pos: any) => {
        const symbolName = symbolMap[pos.symbol_id] || `Symbol-${pos.symbol_id}`
        return {
          ...pos,
          symbol_name: symbolName,
        }
      })

      setPortfolioHistoryCount(historyWithSymbols.length)
      setPortfolioPositionView('open')

      setPortfolioData({
        positions,
        history: historyWithSymbols,
        accountId: accountId,
      })
      
      // Defer spot trading data fetch to load after everything else
      setPortfolioSpotTradesLoading(true)
      setTimeout(() => {
        fetch(`/api/perps/spot-trading?accountId=${accountId}`)
          .then(res => res.json())
          .then(data => {
            setPortfolioSpotVolumeUsd(data.volume_usd?.toString() || '0')
            setPortfolioSpotFeesUsd(data.fees_usd?.toString() || '0')
          })
          .catch(e => {
            console.error('Error fetching spot trades:', e)
            setPortfolioSpotVolumeUsd('0')
            setPortfolioSpotFeesUsd('0')
          })
          .finally(() => setPortfolioSpotTradesLoading(false))
      }, 100)
    } catch (error) {
      console.error('Error loading portfolio:', error)
      setPortfolioError('Failed to load portfolio')
    } finally {
      setPortfolioLoading(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show header when scrolling up, hide when scrolling down past 50px
      if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowHeader(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down and past threshold
        setShowHeader(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  useEffect(() => {
    fetch('/api/traders')
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setUsers(json.users)
        setDataLastChanged(json.lastGitHubFetch || new Date().toLocaleString())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Fetch total spot volume
  useEffect(() => {
    const fetchSpotVolume = async () => {
      setSpotVolumeLoading(true)
      try {
        const res = await fetch('/api/perps/spot-volume')
        const data = await res.json()
        setTotalSpotVolume(data.spotVolume || '0')
      } catch (error) {
        console.error('Error fetching spot volume:', error)
        setTotalSpotVolume('0')
      } finally {
        setSpotVolumeLoading(false)
      }
    }

    fetchSpotVolume()
    // Refresh every 6 hours
    const interval = setInterval(fetchSpotVolume, 6 * 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch total futures volume
  useEffect(() => {
    const fetchFuturesVolume = async () => {
      setFuturesVolumeLoading(true)
      try {
        const res = await fetch('/api/perps/futures-volume')
        const data = await res.json()
        setTotalFuturesVolume(data.futuresVolume || '0')
      } catch (error) {
        console.error('Error fetching futures volume:', error)
        setTotalFuturesVolume('0')
      } finally {
        setFuturesVolumeLoading(false)
      }
    }

    fetchFuturesVolume()
    // Refresh every 6 hours
    const interval = setInterval(fetchFuturesVolume, 6 * 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await fetch('/api/perps/symbols')
        const response = await res.json()
        const symbolMap: Record<number, string> = {}
        
        // Handle different response formats
        let symbolsArray = response
        if (response.data) {
          symbolsArray = response.data
        }
        
        if (Array.isArray(symbolsArray)) {
          symbolsArray.forEach((sym: any) => {
            // Try different field names
            const id = sym.id || sym.symbolID || sym.symbol_id
            const name = sym.name || sym.symbol_name || sym.displayName
            if (id && name) {
              symbolMap[id] = name
            }
          })
        }
        setSymbols(symbolMap)
      } catch (error) {
        console.error('Error fetching symbols:', error)
      }
    }
    fetchSymbols()
  }, [])

  const handlePortfolioBind = async () => {
    if (!portfolioBindInput.trim()) return

    setPortfolioError('')
    setPortfolioLoading(true)
    try {
      const lowerQuery = portfolioBindInput.toLowerCase()
      let accountId = portfolioBindInput

      // If searching by address, find the account ID from users data
      if (portfolioBindInput.startsWith('0x')) {
        const user = users.find(u => u.address.toLowerCase().includes(lowerQuery))
        if (!user) {
          setPortfolioError('Address not found in database')
          setPortfolioLoading(false)
          return
        }
        accountId = user.id
      }

      // Make the same API calls as address tracker
      const accountRes = await fetch(`/api/perps/account?accountId=${accountId}`)
      const accountData = await accountRes.json()

      const historyRes = await fetch(`/api/perps/history?accountId=${accountId}`)
      const historyData = await historyRes.json()

      const spotRes = await fetch(`/api/perps/spot-balance?accountId=${accountId}`)
      const spotData = await spotRes.json()

      const volumeRes = await fetch(`/api/perps/volume?accountId=${accountId}`)
      const volumeData = await volumeRes.json()

      const balance = accountData.data?.balances?.[0]?.walletBalance || '0'
      setPortfolioBalance(balance)
      setPortfolioSpotBalance(spotData.totalSpotBalance || '0')
      setPortfolioCumulativeVolume(volumeData.cumulativeVolume || '0')
      setPortfolioCumulativePnl(volumeData.cumulativePnl || '0')

      const positions = accountData.data?.positions?.map((pos: any) => ({
        ...pos,
        symbol: pos.symbol,
      })) || []

      const history = Array.isArray(historyData) ? historyData : []
      const uniqueSymbolIds = Array.from(new Set(history.map((h: any) => h.symbol_id)))
      
      let symbolMap: Record<number, string> = {}
      if (uniqueSymbolIds.length > 0) {
        const matcherRes = await fetch(`/api/perps/symbol-matcher?ids=${uniqueSymbolIds.join(',')}`)
        symbolMap = await matcherRes.json()
      }

      const historyWithSymbols = history.map((pos: any) => {
        const symbolName = symbolMap[pos.symbol_id] || `Symbol-${pos.symbol_id}`
        return {
          ...pos,
          symbol_name: symbolName,
        }
      })

      setPortfolioHistoryCount(historyWithSymbols.length)
      setPortfolioPositionView('open')

      setPortfolioData({
        positions,
        history: historyWithSymbols,
        accountId: accountId,
      })

      // Store the bound address and close modal
      setPortfolioBoundAddress(portfolioBindInput)
      localStorage.setItem('portfolioBoundAddress', portfolioBindInput)
      setShowPortfolioBindModal(false)
      setPortfolioBindInput('')
      
      // Defer spot trading data fetch to load after everything else
      setPortfolioSpotTradesLoading(true)
      setTimeout(() => {
        fetch(`/api/perps/spot-trading?accountId=${accountId}`)
          .then(res => res.json())
          .then(data => {
            setPortfolioSpotVolumeUsd(data.volume_usd?.toString() || '0')
            setPortfolioSpotFeesUsd(data.fees_usd?.toString() || '0')
          })
          .catch(e => {
            console.error('Error fetching spot trades:', e)
            setPortfolioSpotVolumeUsd('0')
            setPortfolioSpotFeesUsd('0')
          })
          .finally(() => setPortfolioSpotTradesLoading(false))
      }, 100)
    } catch (error) {
      console.error('Error binding portfolio:', error)
      setPortfolioError('Failed to bind portfolio')
    } finally {
      setPortfolioLoading(false)
    }
  }

  const handlePerpsSearch = async () => {
    if (!perpsSearchInput.trim()) return

    setAddressError('')
    setPerpsLoading(true)
    try {
      const lowerQuery = perpsSearchInput.toLowerCase()
      let accountId = perpsSearchInput

      // If searching by address, find the account ID from users data
      if (perpsSearchInput.startsWith('0x')) {
        const user = users.find(u => u.address.toLowerCase().includes(lowerQuery))
        if (!user) {
          setAddressError('Address not found in database')
          setPerpsLoading(false)
          return
        }
        accountId = user.id
      }

      const accountRes = await fetch(`/api/perps/account?accountId=${accountId}`)
      const accountData = await accountRes.json()

      const historyRes = await fetch(`/api/perps/history?accountId=${accountId}`)
      const historyData = await historyRes.json()

      const spotRes = await fetch(`/api/perps/spot-balance?accountId=${accountId}`)
      const spotData = await spotRes.json()

      const volumeRes = await fetch(`/api/perps/volume?accountId=${accountId}`)
      const volumeData = await volumeRes.json()

      const balance = accountData.data?.balances?.[0]?.walletBalance || '0'
      setWalletBalance(balance)
      setSpotBalance(spotData.totalSpotBalance || '0')
      setCumulativeVolume(volumeData.cumulativeVolume || '0')
      setCumulativePnl(volumeData.cumulativePnl || '0')

      const positions = accountData.data?.positions?.map((pos: any) => ({
        ...pos,
        symbol: pos.symbol,
      })) || []

      // Get unique symbol IDs from history
      const history = Array.isArray(historyData) ? historyData : []
      const uniqueSymbolIds = Array.from(new Set(history.map((h: any) => h.symbol_id)))
      
      // Fetch symbol names for these IDs
      let symbolMap: Record<number, string> = {}
      if (uniqueSymbolIds.length > 0) {
        const matcherRes = await fetch(`/api/perps/symbol-matcher?ids=${uniqueSymbolIds.join(',')}`)
        symbolMap = await matcherRes.json()
      }

      const historyWithSymbols = history.map((pos: any) => {
        const symbolName = symbolMap[pos.symbol_id] || `Symbol-${pos.symbol_id}`
        return {
          ...pos,
          symbol_name: symbolName,
        }
      })

      setPositionHistoryCount(historyWithSymbols.length)
      setPositionView('open')

      setPerpsData({
        positions,
        history: historyWithSymbols,
        accountId: accountId,
      })
      
      // Defer spot trading data fetch to load after everything else
      setSpotTradesLoading(true)
      setTimeout(() => {
        fetch(`/api/perps/spot-trading?accountId=${accountId}`)
          .then(res => res.json())
          .then(data => {
            setSpotVolumeUsd(data.volume_usd?.toString() || '0')
            setSpotFeesUsd(data.fees_usd?.toString() || '0')
          })
          .catch(e => {
            console.error('Error fetching spot trades:', e)
            setSpotVolumeUsd('0')
            setSpotFeesUsd('0')
          })
          .finally(() => setSpotTradesLoading(false))
      }, 100)
    } catch (error) {
      console.error('Error fetching data:', error)
      setAddressError('Failed to fetch account data')
    } finally {
      setPerpsLoading(false)
    }
  }

  const totalVolume = users.reduce((sum, u) => sum + parseFloat(u.volume || '0'), 0)
  const totalPnl = users.reduce((sum, u) => sum + parseFloat(u.pnl || '0'), 0)
  const averageTraderPnl = users.length > 0 ? totalPnl / users.length : 0
  const profitableCount = users.filter(u => parseFloat(u.pnl || '0') > 0).length
  const lossCount = users.filter(u => parseFloat(u.pnl || '0') < 0).length
  const benchWarmersCount = users.filter(u => parseFloat(u.volume || '0') === 0).length
  const profitPercent = users.length > 0 ? ((profitableCount / users.length) * 100).toFixed(1) : 0
  const lossPercent = users.length > 0 ? ((lossCount / users.length) * 100).toFixed(1) : 0
  const benchWarmersPercent = users.length > 0 ? ((benchWarmersCount / users.length) * 100).toFixed(1) : 0
  
  // Calculate whales vs retail
  const whaleThreshold = totalVolume * 0.008 // 0.8% of total volume
  const whales = users.filter(u => parseFloat(u.volume || '0') > whaleThreshold)
  const retail = users.filter(u => parseFloat(u.volume || '0') > 0 && parseFloat(u.volume || '0') <= whaleThreshold)
  const whaleCount = whales.length
  const retailCount = retail.length
  const whalePercent = users.length > 0 ? ((whaleCount / users.length) * 100).toFixed(1) : 0
  const retailPercent = users.length > 0 ? ((retailCount / users.length) * 100).toFixed(1) : 0
  const whaleVolume = whales.reduce((sum, u) => sum + parseFloat(u.volume || '0'), 0)
  const retailVolume = retail.reduce((sum, u) => sum + parseFloat(u.volume || '0'), 0)
  const whaleVolPercent = totalVolume > 0 ? ((whaleVolume / totalVolume) * 100).toFixed(1) : 0
  const retailVolPercent = totalVolume > 0 ? ((retailVolume / totalVolume) * 100).toFixed(1) : 0

  const formatNumber = (num) => {
    const parsed = parseFloat(num)
    if (parsed >= 1000000000) return (parsed / 1000000000).toFixed(2) + 'B'
    if (parsed >= 1000000) return (parsed / 1000000).toFixed(2) + 'M'
    if (parsed >= 1000) return (parsed / 1000).toFixed(2) + 'K'
    return parsed.toFixed(2)
  }

  const formatAddress = (address) => {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (sorted === 'pnl') {
      return parseFloat(b.pnl || '0') - parseFloat(a.pnl || '0')
    } else {
      return parseFloat(b.volume || '0') - parseFloat(a.volume || '0')
    }
  })

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResult(null)
      return
    }

    const lowerQuery = query.toLowerCase()
    const foundUser = users.find(u => u.address.toLowerCase().includes(lowerQuery) || u.id.toString() === query)

    if (foundUser) {
      const pnlRank = [...users].sort((a, b) => parseFloat(b.pnl || 0) - parseFloat(a.pnl || 0)).findIndex(u => u.id === foundUser.id) + 1
      const volumeRank = [...users].sort((a, b) => parseFloat(b.volume || 0) - parseFloat(a.volume || 0)).findIndex(u => u.id === foundUser.id) + 1

      setSearchResult({
        ...foundUser,
        pnlRank,
        volumeRank,
      })
    } else {
      setSearchResult(null)
    }
  }

  const topGainers = [...users]
    .sort((a, b) => parseFloat(b.pnl || 0) - parseFloat(a.pnl || 0))
    .slice(0, 3)

  const topLosers = [...users]
    .sort((a, b) => parseFloat(a.pnl || 0) - parseFloat(b.pnl || 0))
    .slice(0, 3)

  const calculateAnalytics = (history: any[], volume: string | number, pnl: string | number) => {
    if (!history || history.length === 0) {
      return {
        totalFeesPaid: 0,
        totalPnl: 0,
        roi: 0,
        avgHoldingTime: 0,
        maxDrawdown: 0,
        bestTrade: null,
        worstTrade: null,
        volume: 0,
        mostTradedPair: null,
      }
    }

    // Total fees paid
    const totalFeesPaid = history.reduce((sum, trade) => sum + parseFloat(trade.cum_trading_fee || '0'), 0)

    // Total PnL - use cumulative PnL from API
    const totalPnl = parseFloat(pnl.toString() || '0')

    // ROI calculation (using cumulative quote volume from API)
    const cumulativeVol = parseFloat(volume.toString() || '0')
    const roi = cumulativeVol > 0 ? ((totalPnl / cumulativeVol) * 100) : 0

    // Average holding time in hours
    const holdingTimes = history.map(trade => (trade.updated_at - trade.created_at) / 1000 / 3600) // in hours
    const avgHoldingTime = holdingTimes.length > 0 ? holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length : 0

    // Best and worst trades
    const sortedByPnl = [...history].sort((a, b) => parseFloat(b.realized_pnl || '0') - parseFloat(a.realized_pnl || '0'))
    const bestTrade = sortedByPnl[0] || null
    const worstTrade = sortedByPnl[sortedByPnl.length - 1] || null

    // Volume from cumulative quote volume
    const volumeValue = cumulativeVol

    // Most traded pair - use symbol_name if available
    const pairCounts: Record<string, number> = {}
    history.forEach(trade => {
      const pair = trade.symbol_name || `Symbol-${trade.symbol_id}`
      pairCounts[pair] = (pairCounts[pair] || 0) + 1
    })
    const mostTradedPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Max drawdown (simplified - based on cumulative PnL from trades)
    let runningPnl = 0
    let peak = 0
    let maxDrawdown = 0
    history.forEach(trade => {
      runningPnl += parseFloat(trade.realized_pnl || '0')
      if (runningPnl > peak) peak = runningPnl
      const drawdown = peak - runningPnl
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    })

    return {
      totalFeesPaid,
      totalPnl,
      roi,
      avgHoldingTime,
      maxDrawdown,
      bestTrade,
      worstTrade,
      volume: volumeValue,
      mostTradedPair,
    }
  }

  return (
    <div>
      {/* Fixed Theme Toggle - Top Right - Aligned */}
      <div className="fixed top-4 right-4 z-40 flex items-center h-10">
        <ThemeToggle />
      </div>

      {/* Floating Glass Header Bar - Always Visible */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-fit">
        <div className="px-4 sm:px-6 py-3 rounded-full border border-white/30 bg-white/10 dark:bg-white/5 backdrop-blur-3xl shadow-2xl hover:bg-white/15 dark:hover:bg-white/10 transition-all">
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-10 w-full">
            {/* Logo and Title - Desktop Only */}
            <div className="flex items-center gap-3 whitespace-nowrap hidden sm:flex flex-shrink-0">
              {theme === 'light' ? (
                <img src="https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg" alt="SoDex Logo" className="h-6 w-auto" />
              ) : (
                <img src="https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75" alt="SoDex Logo" className="h-6 w-auto" />
              )}
              <span className="text-sm font-semibold">Dashboard</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Trading Button */}
              <button
                onClick={() => {
                  setActiveTab('trading');
                  const btn = document.querySelector('[data-nav="trading"]');
                  if (btn) btn.classList.add('liquid-bounce');
                  setTimeout(() => btn?.classList.remove('liquid-bounce'), 600);
                }}
                data-nav="trading"
                className={`px-3 sm:px-5 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'trading'
                    ? 'bg-white/40 dark:bg-white/20 text-foreground shadow-lg backdrop-blur-2xl'
                    : 'hover:bg-white/15 dark:hover:bg-white/10 text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className={activeTab === 'trading' ? 'inline' : 'hidden sm:inline'}>Trading</span>
              </button>

              {/* Portfolio Button */}
              <button
                onClick={() => {
                  setActiveTab('portfolio');
                  const btn = document.querySelector('[data-nav="portfolio"]');
                  if (btn) btn.classList.add('liquid-bounce');
                  setTimeout(() => btn?.classList.remove('liquid-bounce'), 600);
                }}
                data-nav="portfolio"
                className={`px-3 sm:px-5 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'portfolio'
                    ? 'bg-white/40 dark:bg-white/20 text-foreground shadow-lg backdrop-blur-2xl'
                    : 'hover:bg-white/15 dark:hover:bg-white/10 text-foreground'
                }`}
              >
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span className={activeTab === 'portfolio' ? 'inline' : 'hidden sm:inline'}>Portfolio</span>
              </button>

              {/* Address Tracker Button */}
              <button
                onClick={() => {
                  setActiveTab('tracker');
                  const btn = document.querySelector('[data-nav="tracker"]');
                  if (btn) btn.classList.add('liquid-bounce');
                  setTimeout(() => btn?.classList.remove('liquid-bounce'), 600);
                }}
                data-nav="tracker"
                className={`px-3 sm:px-5 py-1.5 rounded-full transition-all font-medium flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'tracker'
                    ? 'bg-white/40 dark:bg-white/20 text-foreground shadow-lg backdrop-blur-2xl'
                    : 'hover:bg-white/15 dark:hover:bg-white/10 text-foreground'
                }`}
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span className={activeTab === 'tracker' ? 'inline' : 'hidden sm:inline'}>Tracker</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header - Above Top Cards */}
      <div className="sm:hidden mt-20 mb-4 px-3">
        <div className="flex items-center gap-2">
          {theme === 'light' ? (
            <img src="https://testnet.sodex.com/assets/SoDEX-Dh5Mk-Pl.svg" alt="SoDex Logo" className="h-8 w-auto" />
          ) : (
            <img src="https://sodex.com/_next/image?url=%2Flogo%2Flogo.webp&w=256&q=75" alt="SoDex Logo" className="h-8 w-auto" />
          )}
          <span className="text-lg font-semibold">Dashboard</span>
        </div>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 sm:mt-20">
        {activeTab === 'trading' && data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all hover:scale-105">
                <CardHeader className="pb-2 px-3 sm:px-6 py-2 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <p className="text-lg sm:text-2xl font-bold">{data.total_users.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all hover:scale-105">
                <CardHeader className="pb-2 px-3 sm:px-6 py-2 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Futures Volume</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 space-y-2">
                  {futuresVolumeLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold">${formatNumber(totalFuturesVolume)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Total Volume = ${formatNumber((parseFloat(totalFuturesVolume) + parseFloat(totalSpotVolume)).toFixed(2))}</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all hover:scale-105">
                <CardHeader className="pb-2 px-3 sm:px-6 py-2 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Spot Volume</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 space-y-2">
                  {spotVolumeLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <p className="text-xs text-muted-foreground">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-lg sm:text-2xl font-bold">${formatNumber(totalSpotVolume)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Total Volume = ${formatNumber((parseFloat(totalFuturesVolume) + parseFloat(totalSpotVolume)).toFixed(2))}</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Traders Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-success">{profitPercent}% In Profit</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-destructive">{lossPercent}% In Loss</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">{benchWarmersPercent}% Bench Warmers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <TopPairs />

            <Volume24h />

            <Card>
              <CardHeader>
                <CardTitle>Whale vs Retail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Whales {String.fromCharCode(62)}0.8% volume</p>
                        <p className="text-2xl font-bold text-blue-500">{whaleCount}</p>
                        <p className="text-xs text-muted-foreground">{whalePercent}% of traders</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Volume controlled</p>
                        <p className="text-lg font-bold text-blue-500">{whaleVolPercent}%</p>
                        <p className="text-xs text-muted-foreground">${formatNumber(whaleVolume)}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Retail {'<'}0.8% volume</p>
                        <p className="text-2xl font-bold text-emerald-500">{retailCount}</p>
                        <p className="text-xs text-muted-foreground">{retailPercent}% of traders</p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Volume controlled</p>
                        <p className="text-lg font-bold text-emerald-500">{retailVolPercent}%</p>
                        <p className="text-xs text-muted-foreground">${formatNumber(retailVolume)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Leaderboard</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant={sorted === 'pnl' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSorted('pnl')}
                        >
                          PnL
                        </Button>
                        <Button
                          variant={sorted === 'volume' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSorted('volume')}
                        >
                          Volume
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by address or ID..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {searchResult && (
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Search Result</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Address */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Address</span>
                              <p className="text-sm font-mono font-semibold">{formatAddress(searchResult.address)}</p>
                            </div>

                            {/* Rankings Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">PnL Rank</p>
                                <p className="text-xl font-bold text-primary">#{searchResult.pnlRank}</p>
                              </div>
                              <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Volume Rank</p>
                                <p className="text-xl font-bold text-primary">#{searchResult.volumeRank}</p>
                              </div>
                            </div>

                            {/* PnL and Volume Grid */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className={`rounded-lg p-3 border ${parseFloat(searchResult.pnl) >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                                <p className="text-xs text-muted-foreground mb-1">Total PnL</p>
                                <p className={`text-lg font-bold ${parseFloat(searchResult.pnl) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  ${formatNumber(searchResult.pnl)}
                                </p>
                              </div>
                              <div className="bg-background/60 rounded-lg p-3 border border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Trading Volume</p>
                                <p className="text-lg font-bold text-foreground">
                                  ${formatNumber(searchResult.volume)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-2">
                        {sortedUsers.slice(leaderboardPage * rowCount, (leaderboardPage + 1) * rowCount).map((user, idx) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                                {leaderboardPage * rowCount + idx + 1}
                              </div>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <p className="text-sm font-mono">{formatAddress(user.address)}</p>
                                <button
                                  onClick={() => navigator.clipboard.writeText(user.address)}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  title="Copy address"
                                >
                                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 text-right">
                              {sorted === 'volume' ? (
                                <div>
                                  <p className="text-sm text-muted-foreground">${formatNumber(user.volume)}</p>
                                </div>
                              ) : (
                                <div className={parseFloat(user.pnl) >= 0 ? 'text-success' : 'text-destructive'}>
                                  <p className="text-sm font-semibold">${formatNumber(user.pnl)}</p>
                                </div>
                              )}
                              <div className="hidden md:block">
                                {sorted === 'volume' ? (
                                  <div className={parseFloat(user.pnl) >= 0 ? 'text-success' : 'text-destructive'}>
                                    <p className="text-sm font-semibold">${formatNumber(user.pnl)}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm text-muted-foreground">${formatNumber(user.volume)}</p>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPerpsSearchInput(user.address)
                                  setActiveTab('tracker')
                                  setTimeout(() => {
                                    const trackerSection = document.getElementById('address-tracker-section')
                                    trackerSection?.scrollIntoView({ behavior: 'smooth' })
                                  }, 100)
                                }}
                                className="text-xs"
                              >
                                Track
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
                        <div className="flex gap-2">
                          <Button
                            variant={rowCount === 10 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setRowCount(10)
                              setLeaderboardPage(0)
                            }}
                          >
                            10
                          </Button>
                          <Button
                            variant={rowCount === 20 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setRowCount(20)
                              setLeaderboardPage(0)
                            }}
                          >
                            20
                          </Button>
                          <Button
                            variant={rowCount === 50 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setRowCount(50)
                              setLeaderboardPage(0)
                            }}
                          >
                            50
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Page {leaderboardPage + 1} of {Math.ceil(sortedUsers.length / rowCount)}
                          </p>
                          <Button
                            onClick={() => setLeaderboardPage(prev => Math.max(0, prev - 1))}
                            disabled={leaderboardPage === 0}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Previous
                          </Button>
                          <Button
                            onClick={() => setLeaderboardPage(prev => Math.min(Math.ceil(sortedUsers.length / rowCount) - 1, prev + 1))}
                            disabled={leaderboardPage >= Math.ceil(sortedUsers.length / rowCount) - 1}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Top Gainers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topGainers.map((user, idx) => (
                      <div key={user.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground font-mono">{formatAddress(user.address)}</p>
                          <Badge variant="outline" className="text-success">#{idx + 1}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-success">${formatNumber(user.pnl)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPerpsSearchInput(user.address)
                              setActiveTab('tracker')
                              setTimeout(() => {
                                const trackerSection = document.getElementById('address-tracker-section')
                                trackerSection?.scrollIntoView({ behavior: 'smooth' })
                              }, 100)
                            }}
                            className="text-xs h-7"
                          >
                            Track
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      Top Losers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topLosers.map((user, idx) => (
                      <div key={user.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground font-mono">{formatAddress(user.address)}</p>
                          <Badge variant="outline" className="text-destructive">#{idx + 1}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-destructive">${formatNumber(user.pnl)}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPerpsSearchInput(user.address)
                              setActiveTab('tracker')
                              setTimeout(() => {
                                const trackerSection = document.getElementById('address-tracker-section')
                                trackerSection?.scrollIntoView({ behavior: 'smooth' })
                              }, 100)
                            }}
                            className="text-xs h-7"
                          >
                            Track
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Custom Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Find traders matching specific volume and PnL criteria</p>
                  
                  {/* Volume Range */}
                  <div>
                    <label className="text-sm font-medium">Volume Range ($)</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={customVolumeMin}
                        onChange={(e) => setCustomVolumeMin(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={customVolumeMax}
                        onChange={(e) => setCustomVolumeMax(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* PnL Range */}
                  <div>
                    <label className="text-sm font-medium">PnL Range ($)</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={customPnlMin}
                        onChange={(e) => setCustomPnlMin(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={customPnlMax}
                        onChange={(e) => setCustomPnlMax(e.target.value)}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* PnL Filter Buttons */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Trader Status</label>
                    <div className="flex gap-2">
                      <Button
                        variant={pnlFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPnlFilter('all')}
                        className="text-xs"
                      >
                        All
                      </Button>
                      <Button
                        variant={pnlFilter === 'profitable' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPnlFilter('profitable')}
                        className="text-xs"
                      >
                        Profitable
                      </Button>
                      <Button
                        variant={pnlFilter === 'loss' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPnlFilter('loss')}
                        className="text-xs"
                      >
                        Loss
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      const hasVolumeFilter = customVolumeMin || customVolumeMax
                      const hasPnlFilter = customPnlMin || customPnlMax
                      
                      if ((hasVolumeFilter || hasPnlFilter) && data?.users) {
                        setAnalyticsLoading(true)
                        
                        // Simulate processing delay
                        setTimeout(() => {
                          const volMin = customVolumeMin ? parseFloat(customVolumeMin) : 0
                          const volMax = customVolumeMax ? parseFloat(customVolumeMax) : Infinity
                          const pnlMin = customPnlMin ? parseFloat(customPnlMin) : -Infinity
                          const pnlMax = customPnlMax ? parseFloat(customPnlMax) : Infinity

                          const matches = data.users.filter((user) => {
                            const volumeMatch = !hasVolumeFilter || (user.volume >= volMin && user.volume <= volMax)
                            const pnlMatch = !hasPnlFilter || (user.pnl >= pnlMin && user.pnl <= pnlMax)
                            
                            let pnlStatusMatch = true
                            if (pnlFilter === 'profitable') {
                              pnlStatusMatch = user.pnl > 0
                            } else if (pnlFilter === 'loss') {
                              pnlStatusMatch = user.pnl < 0
                            }
                            
                            return volumeMatch && pnlMatch && pnlStatusMatch
                          })
                          setMatchingTraders(matches)
                          setShowCustomAnalytics(true)
                          setAnalyticsLoading(false)
                        }, 600)
                      }
                    }}
                    disabled={analyticsLoading}
                    className="w-full"
                  >
                    {analyticsLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Searching...
                      </div>
                    ) : (
                      'Find Matching Traders'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showCustomAnalytics && matchingTraders.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Matching Traders ({matchingTraders.length} found)</CardTitle>
                  <select 
                    value={analyticsRowCount} 
                    onChange={(e) => {
                      setAnalyticsRowCount(Number(e.target.value))
                      setAnalyticsPage(0)
                    }}
                    className="text-xs sm:text-sm px-2 py-1 border border-border rounded-md bg-card"
                  >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                  </select>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="border-b border-border">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-2 px-2">Address</th>
                          <th className="text-right py-2 px-2">Volume</th>
                          <th className="text-right py-2 px-2">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchingTraders.slice(analyticsPage * analyticsRowCount, (analyticsPage + 1) * analyticsRowCount).map((user) => (
                          <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/50">
                            <td className="py-2 px-2 font-mono text-xs flex items-center gap-2">
                              {formatAddress(user.address)}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(user.address)
                                  // Optional: show a toast notification
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="Copy address"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </td>
                            <td className="text-right py-2 px-2">${formatNumber(user.volume)}</td>
                            <td className={`text-right py-2 px-2 font-bold ${user.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                              ${formatNumber(user.pnl)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Page {analyticsPage + 1} of {Math.ceil(matchingTraders.length / analyticsRowCount)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setAnalyticsPage(prev => Math.max(0, prev - 1))}
                        disabled={analyticsPage === 0}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setAnalyticsPage(prev => Math.min(Math.ceil(matchingTraders.length / analyticsRowCount) - 1, prev + 1))}
                        disabled={analyticsPage >= Math.ceil(matchingTraders.length / analyticsRowCount) - 1}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'tracker' && (
          <div id="address-tracker-section" className="space-y-4 sm:space-y-8">
            <Card>
              <CardHeader className="px-3 sm:px-6 py-2 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Search Address</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter wallet address (0x...)"
                    value={perpsSearchInput}
                    onChange={(e) => setPerpsSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePerpsSearch()}
                    className="text-xs sm:text-sm"
                  />
                  <Button onClick={handlePerpsSearch} disabled={perpsLoading} className="text-xs sm:text-sm">
                    {perpsLoading ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {perpsLoading ? (
              <div className="space-y-6">
                {/* Animated search loading state */}
                <div className="flex flex-col items-center justify-center py-16 sm:py-24">
                  {/* Orbiting circles animation */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-6">
                    {/* Central pulsing dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Orbiting circle 1 */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary opacity-75"
                      style={{
                        animation: 'spin 3s linear infinite',
                      }}
                    ></div>
                    
                    {/* Orbiting circle 2 */}
                    <div className="absolute inset-4 sm:inset-6 rounded-full border-2 border-transparent border-b-primary border-l-primary opacity-50"
                      style={{
                        animation: 'spin 2s linear reverse infinite',
                      }}
                    ></div>
                  </div>

                  {/* Loading text with animated dots */}
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">Searching Address</h3>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <span>Fetching data</span>
                      <span className="inline-flex gap-1">
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Shimmer skeleton loaders */}
                <Card className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded-md w-48"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-6 bg-muted rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              perpsData && (
                <div>
                  {addressError && (
                    <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive text-xs sm:text-sm font-medium">{addressError}</p>
                    </div>
                  )}

                  {!addressError && perpsData && (
                    <>
                      <Card>
                        <CardHeader className="px-3 sm:px-6 py-2 sm:py-4">
                          <CardTitle className="text-base sm:text-lg">Balance & Position Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Perps Balance</p>
                              <p className="text-sm sm:text-xl font-bold">${parseFloat(walletBalance).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Spot Balance</p>
                              <p className="text-sm sm:text-xl font-bold">${parseFloat(spotBalance.toString()).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Open Positions</p>
                              <p className="text-sm sm:text-xl font-bold">{perpsData.positions.length}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">Position History</p>
                              <p className="text-sm sm:text-xl font-bold">{positionHistoryCount}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Always show analytics/stats section */}
                      <div className="space-y-6">
                          {(() => {
                            const analytics = calculateAnalytics(perpsData.history, cumulativeVolume, cumulativePnl)
                            return (
                              <>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground"> Futures Fees Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold text-destructive">${analytics.totalFeesPaid.toFixed(2)}</p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className={`text-lg sm:text-2xl font-bold ${analytics.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        ${analytics.totalPnl.toFixed(2)}
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">ROI</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className={`text-lg sm:text-2xl font-bold ${analytics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {analytics.roi.toFixed(2)}%
                                      </p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Holding Time</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold">{analytics.avgHoldingTime.toFixed(1)}h</p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Perps Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold">${parseFloat(walletBalance).toFixed(2)}</p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Spot Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold">${parseFloat(spotBalance.toString()).toFixed(2)}</p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold text-destructive">${analytics.maxDrawdown.toFixed(2)}</p>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Futures Volume</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-lg sm:text-2xl font-bold">{analytics.volume.toFixed(2)}</p>
                                    </CardContent>
                                  </Card>

                                  <Card className={!spotTradesLoading ? 'animate-fade-in-up' : ''}>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Spot Volume</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {spotTradesLoading ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                          <span className="text-xs text-muted-foreground">Loading...</span>
                                        </div>
                                      ) : (
                                        <p className="text-lg sm:text-2xl font-bold">${parseFloat(spotVolumeUsd || '0').toFixed(2)}</p>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card className={!spotTradesLoading ? 'animate-fade-in-up' : ''}>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Spot Fees Paid  </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {spotTradesLoading ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                          <span className="text-xs text-muted-foreground">Loading...</span>
                                        </div>
                                      ) : (
                                        <p className="text-lg sm:text-2xl font-bold text-destructive">${parseFloat(spotFeesUsd || '0').toFixed(6)}</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Best Trade</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {analytics.bestTrade ? (
                                        <div className="space-y-2">
                                          <p className="text-xs text-muted-foreground">{analytics.bestTrade.symbol_name || `Symbol-${analytics.bestTrade.symbol_id}`}</p>
                                          <p className="text-xl font-bold text-success">${parseFloat(analytics.bestTrade.realized_pnl).toFixed(2)}</p>
                                          <p className="text-xs text-muted-foreground">Entry: ${parseFloat(analytics.bestTrade.avg_entry_price).toFixed(2)}</p>
                                          <p className="text-xs text-muted-foreground">Exit: ${parseFloat(analytics.bestTrade.avg_close_price).toFixed(2)}</p>
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground">No trades</p>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Worst Trade</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {analytics.worstTrade ? (
                                        <div className="space-y-2">
                                          <p className="text-xs text-muted-foreground">{analytics.worstTrade.symbol_name || `Symbol-${analytics.worstTrade.symbol_id}`}</p>
                                          <p className="text-xl font-bold text-destructive">${parseFloat(analytics.worstTrade.realized_pnl).toFixed(2)}</p>
                                          <p className="text-xs text-muted-foreground">Entry: ${parseFloat(analytics.worstTrade.avg_entry_price).toFixed(2)}</p>
                                          <p className="text-xs text-muted-foreground">Exit: ${parseFloat(analytics.worstTrade.avg_close_price).toFixed(2)}</p>
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground">No data</p>
                                      )}
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Most Traded Pair</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {analytics.mostTradedPair ? (
                                        <div className="space-y-2">
                                          <p className="text-xl font-bold">{analytics.mostTradedPair}</p>
                                          <p className="text-xs text-muted-foreground">Pair with highest trade frequency</p>
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground">No data</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
                                  <div className="flex justify-center">
                                    <div className="w-full max-w-2xl">
                                      <DailyPnLCalendar history={perpsData.history} />
                                    </div>
                                  </div>
                                  <PnLOverTime history={perpsData.history} />
                                </div>

                                <TradeStatistics history={perpsData.history} />
                                <HoldingTimeProfit history={perpsData.history} />
                              </>
                            )
                          })()}
                      </div>

                      {/* Collapsible Open Positions Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setPositionView(positionView === 'open' ? null : 'open')}
                          className="w-full p-4 bg-secondary/50 hover:bg-secondary/70 flex items-center justify-between text-left font-semibold transition-colors"
                        >
                          <span>Open Positions ({perpsData.positions.length})</span>
                          <svg
                            className={`w-5 h-5 transition-transform ${positionView === 'open' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {positionView === 'open' && (
                          <div className="p-4">
                            <OpenPositions positions={perpsData.positions.slice(0, 5)} />
                            {perpsData.positions.length > 5 && (
                              <div className="mt-4 text-center">
                                <Button variant="outline" onClick={() => setShowAllPositions(!showAllPositions)}>
                                  {showAllPositions ? 'Show Less' : `View All (${perpsData.positions.length})`}
                                </Button>
                                {showAllPositions && (
                                  <div className="mt-4">
                                    <OpenPositions positions={perpsData.positions} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Collapsible Position History Section */}
                      <div className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setPositionView(positionView === 'history' ? null : 'history')}
                          className="w-full p-4 bg-secondary/50 hover:bg-secondary/70 flex items-center justify-between text-left font-semibold transition-colors"
                          disabled={historyLoading}
                        >
                          <span>Position History ({positionHistoryCount})</span>
                          <svg
                            className={`w-5 h-5 transition-transform ${positionView === 'history' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                        {positionView === 'history' && (
                          <div className="p-4 relative">
                            {historyLoading && (
                              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                  <p className="text-sm text-muted-foreground">Loading history...</p>
                                </div>
                              </div>
                            )}
                            <PositionHistory history={perpsData.history.slice(0, 5)} />
                            {positionHistoryCount > 5 && (
                              <div className="mt-4 text-center">
                                <Button variant="outline" onClick={() => setShowAllPositionHistory(!showAllPositionHistory)}>
                                  {showAllPositionHistory ? 'Show Less' : `View All (${positionHistoryCount})`}
                                </Button>
                                {showAllPositionHistory && (
                                  <div className="mt-4">
                                    <PositionHistory history={perpsData.history} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-4 sm:space-y-8">
            {!portfolioBoundAddress ? (
              // Bind Portfolio Modal
              <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg sm:text-2xl">Bind Your Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Enter your wallet address to bind your portfolio. This address will be saved and automatically tracked.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter wallet address (0x...)"
                      value={portfolioBindInput}
                      onChange={(e) => setPortfolioBindInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePortfolioBind()}
                      className="text-xs sm:text-sm"
                    />
                    <Button 
                      onClick={handlePortfolioBind} 
                      disabled={portfolioLoading}
                      className="text-xs sm:text-sm"
                    >
                      {portfolioLoading ? (
                        <>
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Binding...
                        </>
                      ) : (
                        'Bind Portfolio'
                      )}
                    </Button>
                  </div>
                  {portfolioError && (
                    <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-destructive text-xs sm:text-sm">{portfolioError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Portfolio View (same as address tracker)
              <div className="space-y-4 sm:space-y-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Bound Portfolio: {formatAddress(portfolioBoundAddress)}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={() => {
                            setPortfolioBoundAddress(null)
                            setPortfolioData(null)
                            setPortfolioError('')
                            localStorage.removeItem('portfolioBoundAddress')
                          }}
                      className="text-xs"
                    >
                      Unbind
                    </Button>
                  </CardHeader>
                </Card>

                {portfolioLoading ? (
                  <Card>
                    <CardContent className="py-8 sm:py-12">
                      <div className="space-y-6">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">Loading portfolio data...</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : portfolioData && (
                  <>
                    {/* Balance & Position Summary */}
                    <Card>
                      <CardHeader className="px-3 sm:px-6 py-2 sm:py-4">
                        <CardTitle className="text-base sm:text-lg">Balance & Position Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6">
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Perps Balance</p>
                            <p className="text-xs sm:text-lg font-bold">${parseFloat(portfolioBalance).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Spot Balance</p>
                            <p className="text-xs sm:text-lg font-bold">${parseFloat(portfolioSpotBalance.toString()).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Open Positions</p>
                            <p className="text-xs sm:text-lg font-bold">{portfolioData.positions.length}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-muted-foreground">Position History</p>
                            <p className="text-xs sm:text-lg font-bold">{portfolioHistoryCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Portfolio Position View Tabs */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => setPortfolioPositionView('open')}
                        variant={portfolioPositionView === 'open' ? 'default' : 'outline'}
                        className="flex-1 text-sm sm:text-base"
                      >
                        Open Positions
                      </Button>
                      <Button
                        onClick={() => setPortfolioPositionView('history')}
                        variant={portfolioPositionView === 'history' ? 'default' : 'outline'}
                        className="flex-1 text-sm sm:text-base"
                      >
                        Position History
                      </Button>
                    </div>

                    {portfolioPositionView === 'open' && <OpenPositions positions={portfolioData.positions} />}
                    {portfolioPositionView === 'history' && (
                      <div className="space-y-4">
                        <PositionHistory history={showAllPortfolioHistory ? portfolioData.history : portfolioData.history.slice(0, 5)} />
                        {portfolioData.history.length > 5 && (
                          <Button 
                            onClick={() => setShowAllPortfolioHistory(!showAllPortfolioHistory)}
                            variant="outline"
                            className="w-full"
                          >
                            {showAllPortfolioHistory ? 'Show Less' : 'View All Position History'}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Auto-loaded Analytics Section */}
                    <div className="space-y-6 border-t pt-6">
                        {(() => {
                          const analytics = calculateAnalytics(portfolioData.history, portfolioCumulativeVolume, portfolioCumulativePnl)
                          return (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Futures Fees Paid </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm sm:text-2xl font-bold text-destructive">${analytics.totalFeesPaid.toFixed(2)}</p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total PnL</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className={`text-sm sm:text-2xl font-bold ${analytics.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      ${analytics.totalPnl.toFixed(2)}
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">ROI</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className={`text-sm sm:text-2xl font-bold ${analytics.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      {analytics.roi.toFixed(2)}%
                                    </p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Holding Time</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm sm:text-2xl font-bold">{analytics.avgHoldingTime.toFixed(1)}h</p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm sm:text-2xl font-bold text-destructive">${analytics.maxDrawdown.toFixed(2)}</p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Futures Volume</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm sm:text-2xl font-bold">${analytics.volume.toFixed(2)}</p>
                                  </CardContent>
                                </Card>

                                <Card className={!portfolioSpotTradesLoading ? 'animate-fade-in-up' : ''}>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Spot Volume</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {portfolioSpotTradesLoading ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-muted-foreground">Loading...</span>
                                      </div>
                                    ) : (
                                      <p className="text-sm sm:text-2xl font-bold">${parseFloat(portfolioSpotVolumeUsd || '0').toFixed(2)}</p>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card className={!portfolioSpotTradesLoading ? 'animate-fade-in-up' : ''}>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Spot Fees Paid  </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {portfolioSpotTradesLoading ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-muted-foreground">Loading...</span>
                                      </div>
                                    ) : (
                                      <p className="text-sm sm:text-2xl font-bold text-destructive">${parseFloat(portfolioSpotFeesUsd || '0').toFixed(6)}</p>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-1 sm:pb-2">
                                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Perps Balance</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm sm:text-2xl font-bold">${parseFloat(portfolioBalance).toFixed(2)}</p>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Spot Balance</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-2xl font-bold">${parseFloat(portfolioSpotBalance.toString()).toFixed(2)}</p>
                                  </CardContent>
                                </Card>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Best Trade</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {analytics.bestTrade ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">{analytics.bestTrade.symbol_name || `Symbol-${analytics.bestTrade.symbol_id}`}</p>
                                        <p className="text-xl font-bold text-success">${parseFloat(analytics.bestTrade.realized_pnl).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Entry: ${parseFloat(analytics.bestTrade.avg_entry_price).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Exit: ${parseFloat(analytics.bestTrade.avg_close_price).toFixed(2)}</p>
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">No trades</p>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Worst Trade</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {analytics.worstTrade ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">{analytics.worstTrade.symbol_name || `Symbol-${analytics.worstTrade.symbol_id}`}</p>
                                        <p className="text-xl font-bold text-destructive">${parseFloat(analytics.worstTrade.realized_pnl).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Entry: ${parseFloat(analytics.worstTrade.avg_entry_price).toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">Exit: ${parseFloat(analytics.worstTrade.avg_close_price).toFixed(2)}</p>
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">No data</p>
                                    )}
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-sm">Most Traded Pair</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {analytics.mostTradedPair ? (
                                      <div className="space-y-2">
                                        <p className="text-xl font-bold">{analytics.mostTradedPair}</p>
                                        <p className="text-xs text-muted-foreground">Pair with highest frequency</p>
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">No data</p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
                                <div className="flex justify-center">
                                  <div className="w-full max-w-2xl">
                                    <DailyPnLCalendar history={portfolioData.history} />
                                  </div>
                                </div>
                                <PnLOverTime history={portfolioData.history} />
                              </div>
                              <TradeStatistics history={portfolioData.history} />
                              <HoldingTimeProfit history={portfolioData.history} />
                            </>
                          )
                        })()}
                      </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <footer className="border-t border-border/40 py-4 px-4 mt-8">
          <div className="flex justify-center gap-4">
            <a
              href="https://x.com/eliasing__"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X (Twitter)"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.81-5.974 6.81H2.42l7.728-8.835L1.242 2.25h6.826l4.721 6.231 5.529-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://t.me/fallphile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Telegram"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.485-1.313.476-.431-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.155.201-.315.541-.567 2.183-1.51 4.29-3.15 6.395-4.79.2-.135.393-.274.581-.425 1.486-1.084 2.763-2.01 2.763-2.01zm-.443 1.9c-.019.887-.235 1.779-.235 1.779s-.233 1.248-.868 2.868c-.6 1.537-1.92 2.27-2.405 2.32-.484.049-1.09-.327-1.68-.756-.279-.204-.54-.428-.769-.667l-.003.002c-.178-.177-.360-.357-.541-.534 1.668-1.477 2.871-2.771 3.127-4.528.133-.849.073-1.694-.193-2.584z" />
              </svg>
            </a>
          </div>
        </footer>
      </main>
    </div>
  )
}
