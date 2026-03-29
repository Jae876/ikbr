import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'individual'
  })

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const validatePassword = (pwd: string) => {
    setPasswordRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'password') {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First and last names are required')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!Object.values(passwordRequirements).every(req => req)) {
      setError('Password does not meet all requirements')
      return
    }

    try {
      setLoading(true)

      // API call to signup
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          accountType: formData.accountType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      setSuccess(true)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibkr-dark via-ibkr-navy to-ibkr-blue flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Benefits */}
          <div className="hidden md:block text-white">
            <h1 className="text-4xl font-bold mb-8 tracking-tight">
              Start Trading<br />
              <span className="bg-gradient-to-r from-red-300 to-white bg-clip-text text-transparent">
                Today
              </span>
            </h1>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Low Commissions</h3>
                  <p className="text-red-100 text-sm">Industry-leading rates</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Global Markets</h3>
                  <p className="text-red-100 text-sm">150+ markets available</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">Advanced Tools</h3>
                  <p className="text-red-100 text-sm">Professional-grade platform</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">24/5 Support</h3>
                  <p className="text-red-100 text-sm">Expert assistance always</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-10 border-2 border-ibkr-gray-300">
            <h2 className="text-3xl font-bold text-ibkr-navy mb-2 tracking-tight">Create Account</h2>
            <p className="text-ibkr-gray-600 mb-8 font-medium">Join thousands of traders worldwide</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-ibkr-danger rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-ibkr-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-ibkr-success rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-ibkr-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 font-medium">Account created successfully! Redirecting to dashboard...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-ibkr-blue" />
                      First Name
                    </div>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-ibkr-blue" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="input-field"
                  required
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="institutional">Institutional</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-ibkr-blue" />
                    Password
                  </div>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-3 p-3 bg-ibkr-gray-50 rounded-lg border border-ibkr-gray-300">
                    <p className="text-xs font-semibold text-ibkr-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-2">
                      {[
                        { req: passwordRequirements.length, label: 'At least 8 characters' },
                        { req: passwordRequirements.uppercase, label: 'One uppercase letter' },
                        { req: passwordRequirements.lowercase, label: 'One lowercase letter' },
                        { req: passwordRequirements.number, label: 'One number' },
                        { req: passwordRequirements.special, label: 'One special character (!@#$%^&*)' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.req ? 'bg-ibkr-success' : 'bg-ibkr-gray-300'}`}>
                            {item.req && <span className="text-white text-xs">✓</span>}
                          </div>
                          <span className={item.req ? 'text-ibkr-success' : 'text-ibkr-gray-600'}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-ibkr-gray-900 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              {/* Sign In Link */}
              <p className="text-center text-ibkr-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-ibkr-blue hover:text-ibkr-navy transition">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
