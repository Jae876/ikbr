import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Settings, Download, Send, Plus } from 'lucide-react'
import WithdrawalModal from '@components/modals/WithdrawalModal'
import AddFundsModal from '@components/modals/AddFundsModal'
import PlaceTradeModal from '@components/modals/PlaceTradeModal'
import AdvancedChartsModal from '@components/modals/AdvancedChartsModal'
import AlertsModal from '@components/modals/AlertsModal'

interface Position {
  symbol: string
  quantity: number
  avgCost: number
  currentPrice: number
  unrealizedPL: number
  unrealizedPLPercent: number
}

interface Transaction {
  date: string
  type: string
  amount: number
  description: string
  balance: number
}

interface User {
  firstName: string
  lastName: string
  account?: {
    balance: number
    buyingPower: number
    createdAt?: string
    totalDeposits?: number
    unrealizedGains?: number
    target?: number
    positions: Position[]
    transactions?: Transaction[]
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [accountValue, setAccountValue] = useState(0)
  const [dayChange, setDayChange] = useState(0)
  const [dayChangePercent, setDayChangePercent] = useState(0)
  const [totalDeposits, setTotalDeposits] = useState(0)
  const [unrealizedGains, setUnrealizedGains] = useState(0)
  const [accountTarget, setAccountTarget] = useState(5000000)
  const [expandedCard, setExpandedCard] = useState<'accountValue' | 'netGains' | null>(null)
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false)
  const [isPlaceTradeOpen, setIsPlaceTradeOpen] = useState(false)
  const [isAdvancedChartsOpen, setIsAdvancedChartsOpen] = useState(false)
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<{
    withdrawAmount: number
    depositAmount: number
    bankName: string
    accountNumber: string
    routingNumber: string
  } | null>(null)

  useEffect(() => {
    loadUserData()
  }, [navigate])

  const loadUserData = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        navigate('/login')
        return
      }

      const userData: User = JSON.parse(userStr)
      setUser(userData)

      if (userData.account) {
        const positionsData = userData.account.positions || []
        setPositions(positionsData)

        // Calculate total unrealized P&L
        const totalUnrealizedPL = positionsData.reduce((sum, pos) => sum + pos.unrealizedPL, 0)
        
        setAccountValue(userData.account.balance)
        setDayChange(totalUnrealizedPL)
        setDayChangePercent((totalUnrealizedPL / userData.account.balance) * 100)
        setTotalDeposits(userData.account.totalDeposits || 0)
        setUnrealizedGains(userData.account.unrealizedGains || 0)
        setAccountTarget(userData.account.target || 5000000)
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      navigate('/login')
    }
  }

  // Handle crypto deposit required for withdrawal
  const handleWithdrawalDepositRequired = (depositAmount: number, withdrawAmount: number, bankName: string, accountNumber: string, routingNumber: string) => {
    // Store pending withdrawal details
    setPendingWithdrawal({
      withdrawAmount,
      depositAmount,
      bankName,
      accountNumber,
      routingNumber
    })
    
    // Close withdrawal modal and open add funds modal
    setIsWithdrawalOpen(false)
    setIsAddFundsOpen(true)
  }

  // Handle regular crypto deposit (standalone)
  const handleAddFunds = (amount: number, cryptoType: string, txHash: string) => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const userData: User = JSON.parse(userStr)
      if (!userData.account) return

      // Convert crypto amounts to USD equivalent
      const cryptoUsdValues: { [key: string]: number } = {
        BITCOIN: amount * 67500,
        USDT: amount,
        USDC: amount
      }

      const usdAmount = cryptoUsdValues[cryptoType] || 0
      if (usdAmount <= 0) return

      const newBalance = userData.account.balance + usdAmount

      // Determine if this is for withdrawal security or regular deposit
      let description: string
      if (pendingWithdrawal) {
        description = `Security Deposit (Withdrawal): ${cryptoType} ${amount.toFixed(8)} - TxHash: ${txHash.slice(0, 10)}...`
      } else {
        description = `Crypto Deposit: ${cryptoType} (${amount.toFixed(8)}) - TxHash: ${txHash.slice(0, 10)}...`
      }

      const newTransaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        type: 'deposit',
        amount: usdAmount,
        description,
        balance: newBalance
      }

      userData.account.balance = newBalance
      userData.account.totalDeposits = (userData.account.totalDeposits || 0) + usdAmount

      if (!userData.account.transactions) userData.account.transactions = []
      userData.account.transactions.push(newTransaction)

      // If this was for a withdrawal security deposit, process the withdrawal
      if (pendingWithdrawal && usdAmount >= pendingWithdrawal.depositAmount * 0.95) {
        const finalBalance = newBalance - pendingWithdrawal.withdrawAmount

        const withdrawalTxn: Transaction = {
          date: new Date().toISOString().split('T')[0],
          type: 'withdrawal',
          amount: -pendingWithdrawal.withdrawAmount,
          description: `Withdrawal to ${pendingWithdrawal.bankName} (••••${pendingWithdrawal.accountNumber.slice(-4)}) - Security Deposit Verified`,
          balance: finalBalance
        }

        userData.account.balance = finalBalance
        userData.account.transactions.push(withdrawalTxn)
        setPendingWithdrawal(null)
      }

      localStorage.setItem('user', JSON.stringify(userData))
      loadUserData()
    } catch (err) {
      console.error('Error processing deposit:', err)
    }
  }

  // Handle completing withdrawal without deposit requirement (for backward compatibility)
  const handleWithdrawalConfirm = (amount: number, bankName: string, accountNumber: string, _routingNumber: string) => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return

      const userData: User = JSON.parse(userStr)
      if (!userData.account) return

      const newBalance = userData.account.balance - amount

      const newTransaction: Transaction = {
        date: new Date().toISOString().split('T')[0],
        type: 'withdrawal',
        amount: -amount,
        description: `Withdrawal to ${bankName} (••••${accountNumber.slice(-4)}) - Security Verified`,
        balance: newBalance
      }

      userData.account.balance = newBalance
      if (!userData.account.transactions) userData.account.transactions = []
      userData.account.transactions.push(newTransaction)

      localStorage.setItem('user', JSON.stringify(userData))
      loadUserData()
    } catch (err) {
      console.error('Error processing withdrawal:', err)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container-max py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user ? `${user.firstName} ${user.lastName}` : 'User'}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-6 h-6 text-gray-600" />
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Account Settings"
              >
                <Settings className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Account Value - Clickable & Expandable */}
          <div 
            onClick={() => setExpandedCard(expandedCard === 'accountValue' ? null : 'accountValue')}
            className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${expandedCard === 'accountValue' ? 'md:col-span-2 row-span-2' : ''}`}
          >
            <p className="text-gray-600 text-sm font-medium mb-2">Account Value</p>
            <h3 className={`font-bold text-gray-900 mb-2 transition-all duration-300 ${expandedCard === 'accountValue' ? 'text-5xl' : 'text-2xl'}`}>
              ${accountValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
            <div className="flex items-center space-x-2 text-green-600">
              <ArrowUpRight className={`transition-all duration-300 ${expandedCard === 'accountValue' ? 'w-6 h-6' : 'w-4 h-4'}`} />
              <span className={`font-medium transition-all duration-300 ${expandedCard === 'accountValue' ? 'text-lg' : 'text-sm'}`}>
                +${dayChange.toLocaleString('en-US', { minimumFractionDigits: 0 })} ({dayChangePercent.toFixed(2)}%)
              </span>
            </div>
            {expandedCard === 'accountValue' && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Target Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${accountTarget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Amount to Target</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${Math.max(0, accountTarget - accountValue).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium mb-2">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((accountValue / accountTarget) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {Math.min((accountValue / accountTarget) * 100, 100).toFixed(1)}% of target
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/profile')
                  }}
                  className="w-full mt-4 px-3 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition text-sm"
                >
                  Edit Target
                </button>
                <p className="text-xs text-gray-500 text-center">Click to collapse</p>
              </div>
            )}
          </div>

          {/* Total Deposits */}
          <div className="card p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Deposits</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 0 })}</h3>
            <p className="text-sm text-gray-500">Since 2015</p>
          </div>

          {/* Unrealized Gains - Clickable & Expandable */}
          <div 
            onClick={() => setExpandedCard(expandedCard === 'netGains' ? null : 'netGains')}
            className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${expandedCard === 'netGains' ? 'md:col-span-2 row-span-2' : ''}`}
          >
            <p className="text-gray-600 text-sm font-medium mb-2">Net Gains</p>
            <h3 className={`font-bold text-green-600 mb-2 transition-all duration-300 ${expandedCard === 'netGains' ? 'text-5xl' : 'text-2xl'}`}>
              ${unrealizedGains.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </h3>
            <p className={`text-gray-500 transition-all duration-300 ${expandedCard === 'netGains' ? 'text-base' : 'text-sm'}`}>
              Trading & dividends
            </p>
            {expandedCard === 'netGains' && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                <p>Click to collapse</p>
              </div>
            )}
          </div>

          {/* Positions */}
          <div className="card p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Open Positions</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{positions.length}</h3>
            <p className="text-sm text-gray-500">Active trades</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => setIsAddFundsOpen(true)}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Add Funds</h3>
                <p className="text-xs text-gray-500">Deposit crypto (BTC, USDT, USDC)</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsWithdrawalOpen(true)}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-red-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Withdraw</h3>
                <p className="text-xs text-gray-500">Security verified withdrawal</p>
              </div>
            </div>
          </button>
        </div>

        {/* Positions Table */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Open Positions</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Symbol</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Quantity</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Avg. Cost</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Current</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Unrealized P&L</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {positions.map((position) => (
                  <tr key={position.symbol} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">{position.symbol}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">{position.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-700">${position.avgCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">${position.currentPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`flex items-center justify-end space-x-1 ${position.unrealizedPL > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.unrealizedPL > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span className="font-bold">
                          {position.unrealizedPL > 0 ? '+' : ''}{position.unrealizedPL.toFixed(2)} ({position.unrealizedPLPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-ibkr-blue hover:bg-blue-50 px-4 py-2 rounded font-medium transition-colors">
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <button 
            onClick={() => setIsPlaceTradeOpen(true)}
            className="card p-8 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-4">📈</div>
            <h3 className="font-bold text-gray-900 mb-2">Place Trade</h3>
            <p className="text-gray-600 text-sm">Buy or sell securities</p>
          </button>

          <button 
            onClick={() => setIsAdvancedChartsOpen(true)}
            className="card p-8 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-bold text-gray-900 mb-2">Advanced Charts</h3>
            <p className="text-gray-600 text-sm">Technical analysis tools</p>
          </button>

          <button 
            onClick={() => setIsAlertsOpen(true)}
            className="card p-8 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="font-bold text-gray-900 mb-2">Alerts</h3>
            <p className="text-gray-600 text-sm">Price and news alerts</p>
          </button>

          <Link
            to="/transactions"
            className="card p-8 text-center hover:shadow-lg transition-shadow cursor-pointer hover:bg-blue-50"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-bold text-gray-900 mb-2">History</h3>
            <p className="text-gray-600 text-sm">Full transaction history</p>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <WithdrawalModal
        isOpen={isWithdrawalOpen}
        onClose={() => {
          setIsWithdrawalOpen(false)
          setPendingWithdrawal(null)
        }}
        availableBalance={accountValue}
        accountTarget={accountTarget}
        accountInfo={{ createdAt: user?.account?.createdAt || '2015-01-15' }}
        onConfirm={handleWithdrawalConfirm}
        onDepositRequired={handleWithdrawalDepositRequired}
      />

      <AddFundsModal
        isOpen={isAddFundsOpen}
        onClose={() => {
          setIsAddFundsOpen(false)
          if (!pendingWithdrawal) setPendingWithdrawal(null)
        }}
        onConfirm={handleAddFunds}
      />

      <PlaceTradeModal
        isOpen={isPlaceTradeOpen}
        onClose={() => setIsPlaceTradeOpen(false)}
        accountBalance={accountValue}
      />

      <AdvancedChartsModal
        isOpen={isAdvancedChartsOpen}
        onClose={() => setIsAdvancedChartsOpen(false)}
      />

      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />
    </div>
  )
}
