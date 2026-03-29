import { useState, useEffect } from 'react'
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  const ADMIN_PASSWORD = 'jaeseanjae' // Fallback local password

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('adminToken')
    const authTime = localStorage.getItem('adminAuthTime')
    
    if (token && authTime) {
      const elapsed = Date.now() - parseInt(authTime)
      // Token valid for 24 hours
      if (elapsed < 24 * 60 * 60 * 1000) {
        setAuthenticated(true)
        return
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      
      // Try backend authentication first
      try {
        const response = await fetch(`${apiUrl}/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        })

        const data = await response.json()

        if (response.ok && data.token) {
          localStorage.setItem('adminToken', data.token)
          localStorage.setItem('adminAuthTime', Date.now().toString())
          localStorage.setItem('adminUser', JSON.stringify(data.admin))
          setAuthenticated(true)
          setPassword('')
          return
        }
      } catch (err) {
        console.log('Backend auth unavailable, using fallback')
      }

      // Fallback to local password verification
      setTimeout(() => {
        if (password === ADMIN_PASSWORD) {
          localStorage.setItem('adminToken', 'local_' + Date.now())
          localStorage.setItem('adminAuthTime', Date.now().toString())
          localStorage.setItem('adminUser', JSON.stringify({ username: 'admin', role: 'admin' }))
          setAuthenticated(true)
          setPassword('')
        } else {
          setError('Invalid password')
          setPassword('')
        }
        setLoading(false)
      }, 500)
    } catch (err) {
      setError('Authentication failed')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminAuthTime')
    localStorage.removeItem('adminUser')
    setAuthenticated(false)
  }

  if (authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibkr-dark via-ibkr-navy to-ibkr-blue py-12 px-4">
        <div className="container-max">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-red-100 font-medium">System Management & Analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Stats Cards */}
            {[
              { label: 'Total Users', value: '1,247', color: 'from-blue-500 to-ibkr-blue' },
              { label: 'Active Trading', value: '847', color: 'from-emerald-500 to-green-600' },
              { label: 'Total Volume', value: '$2.4B', color: 'from-orange-500 to-red-500' },
              { label: 'Platform Status', value: 'Operational', color: 'from-purple-500 to-pink-600' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 border-2 border-white/20 rounded-xl p-6 backdrop-blur-md hover:border-white/40 transition-all duration-300">
                <p className="text-white/60 text-sm font-semibold mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                <div className={`h-1 rounded-full bg-gradient-to-r ${stat.color}`}></div>
              </div>
            ))}
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* User Management */}
            <div className="card-premium bg-white p-8">
              <h3 className="text-xl font-bold text-ibkr-navy mb-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                User Management
              </h3>
              <p className="text-ibkr-gray-600 mb-4 font-medium">Manage user accounts, permissions, and access levels</p>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-ibkr-blue text-white rounded-lg hover:bg-ibkr-navy transition font-semibold text-sm">
                  View All Users
                </button>
                <button className="w-full py-2 px-4 bg-ibkr-gray-100 text-ibkr-blue rounded-lg hover:bg-ibkr-gray-200 transition font-semibold text-sm border border-ibkr-blue">
                  Manage Roles
                </button>
              </div>
            </div>

            {/* Analytics */}
            <div className="card-premium bg-white p-8">
              <h3 className="text-xl font-bold text-ibkr-navy mb-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                Analytics
              </h3>
              <p className="text-ibkr-gray-600 mb-4 font-medium">System performance, user activity, and trading metrics</p>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-ibkr-blue text-white rounded-lg hover:bg-ibkr-navy transition font-semibold text-sm">
                  View Analytics
                </button>
                <button className="w-full py-2 px-4 bg-ibkr-gray-100 text-ibkr-blue rounded-lg hover:bg-ibkr-gray-200 transition font-semibold text-sm border border-ibkr-blue">
                  Export Reports
                </button>
              </div>
            </div>

            {/* Security */}
            <div className="card-premium bg-white p-8">
              <h3 className="text-xl font-bold text-ibkr-navy mb-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                Security
              </h3>
              <p className="text-ibkr-gray-600 mb-4 font-medium">Monitor system security, logs, and suspicious activity</p>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-ibkr-blue text-white rounded-lg hover:bg-ibkr-navy transition font-semibold text-sm">
                  Security Logs
                </button>
                <button className="w-full py-2 px-4 bg-ibkr-gray-100 text-ibkr-blue rounded-lg hover:bg-ibkr-gray-200 transition font-semibold text-sm border border-ibkr-blue">
                  Alert Settings
                </button>
              </div>
            </div>

            {/* Database */}
            <div className="card-premium bg-white p-8">
              <h3 className="text-xl font-bold text-ibkr-navy mb-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <span className="text-2xl">💾</span>
                </div>
                Database
              </h3>
              <p className="text-ibkr-gray-600 mb-4 font-medium">Manage backups, migrations, and database maintenance</p>
              <div className="space-y-2">
                <button className="w-full py-2 px-4 bg-ibkr-blue text-white rounded-lg hover:bg-ibkr-navy transition font-semibold text-sm">
                  Database Status
                </button>
                <button className="w-full py-2 px-4 bg-ibkr-gray-100 text-ibkr-blue rounded-lg hover:bg-ibkr-gray-200 transition font-semibold text-sm border border-ibkr-blue">
                  Backup Now
                </button>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-bold"
            >
              Logout from Admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Password Entry Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-ibkr-dark via-ibkr-navy to-ibkr-blue flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-10 border-2 border-ibkr-gray-300">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg border border-red-600">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-ibkr-navy mb-2 tracking-tight">Admin Access</h1>
            <p className="text-ibkr-gray-600 font-medium">Password-Protected Area</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-ibkr-danger rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ibkr-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  Admin Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ibkr-gray-500 hover:text-ibkr-blue transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-ibkr-gray-500 mt-2 font-medium">This area is restricted to authorized personnel only</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-b from-red-500 to-red-700 hover:shadow-lg border border-red-700"
            >
              {loading ? 'Verifying...' : 'Access Admin Panel'}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-8 border-t-2 border-ibkr-gray-300">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-300">
              <p className="text-xs text-amber-900 font-semibold">
                🔐 This access is logged and monitored. Unauthorized access attempts will be recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
