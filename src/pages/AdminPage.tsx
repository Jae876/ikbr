import { useState, useEffect } from 'react'
import { Lock, AlertCircle, Eye, EyeOff, Trash2, Edit2, Plus, X, Save, LogOut } from 'lucide-react'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  account_type: string
  created_at_account: string
  balance: number
  buying_power: number
  transaction_count: number
}

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalVolume: number
  totalDeposits: number
  totalAccounts: number
  averageBalance: number
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', accountType: '' })

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

  useEffect(() => {
    if (authenticated) {
      loadUsers()
      loadStats()
    }
  }, [authenticated])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      firstName: user.first_name,
      lastName: user.last_name,
      accountType: user.account_type
    })
    setShowEditModal(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/users`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser.id,
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          accountType: editForm.accountType
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingUser(null)
        loadUsers()
      }
    } catch (err) {
      console.error('Error saving user:', err)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/users`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setDeleteConfirm(null)
        loadUsers()
      }
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleSeedDemoUser = async () => {
    try {
      setLoadingUsers(true)
      const token = localStorage.getItem('adminToken')
      console.log('Seeding demo user with token:', token?.substring(0, 20) + '...')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/admin/seed-demo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('Seed response:', data, 'Status:', response.status)

      if (response.ok) {
        alert(`Demo user ${data.message === 'Demo user already exists' ? 'already exists' : 'created successfully'}!\nEmail: demo@example.com\nPassword: Demo123!@`)
        await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay to ensure DB write
        loadUsers()
      } else {
        alert(`Error: ${data.error || 'Failed to seed demo user'}\n${data.detail || ''}`)
      }
    } catch (err) {
      console.error('Error seeding demo user:', err)
      alert(`Failed to seed demo user: ${(err as Error)?.message || 'Unknown error'}`)
    } finally {
      setLoadingUsers(false)
    }
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
            {/* Stats Cards - Real Data */}
            {[
              { label: 'Total Users', value: stats?.totalUsers.toLocaleString() || '0', color: 'from-blue-500 to-ibkr-blue' },
              { label: 'Active Users (30d)', value: stats?.activeUsers.toLocaleString() || '0', color: 'from-emerald-500 to-green-600' },
              { label: 'Total Volume', value: '$' + (stats?.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 }) || '0'), color: 'from-orange-500 to-red-500' },
              { label: 'Total Accounts', value: stats?.totalAccounts.toLocaleString() || '0', color: 'from-purple-500 to-pink-600' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 border-2 border-white/20 rounded-xl p-6 backdrop-blur-md hover:border-white/40 transition-all duration-300">
                <p className="text-white/60 text-sm font-semibold mb-2">{stat.label}</p>
                <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                <div className={`h-1 rounded-full bg-gradient-to-r ${stat.color}`}></div>
              </div>
            ))}
          </div>

          {/* User Management Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-ibkr-navy">User Management</h2>
              <button
                onClick={handleSeedDemoUser}
                disabled={loadingUsers}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Seed Demo User
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Account Type</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Balance</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Transactions</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.first_name} {user.last_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">{user.account_type}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">${user.balance?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900">{user.transaction_count}</td>
                        <td className="px-6 py-4 text-sm text-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          {deleteConfirm === user.id ? (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs font-medium"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                          {deleteConfirm === user.id && (
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-xs font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-bold"
            >
              <LogOut className="w-5 h-5" />
              Logout from Admin
            </button>
          </div>

          {/* Edit Modal */}
          {showEditModal && editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">First Name</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Account Type</label>
                    <select
                      value={editForm.accountType}
                      onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    >
                      <option value="individual">Individual</option>
                      <option value="joint">Joint</option>
                      <option value="ira">IRA</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Balance</label>
                    <input
                      type="text"
                      value={'$' + editingUser.balance?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '$0'}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
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
