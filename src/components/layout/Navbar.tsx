import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <nav className="bg-white border-b-2 border-ibkr-gray-300 sticky top-0 z-50 shadow-md">
      <div className="container-max flex justify-between items-center h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
          <div className="w-9 h-9 bg-gradient-to-br from-ibkr-blue to-ibkr-navy rounded-lg flex items-center justify-center shadow-md border border-ibkr-blue">
            <span className="text-white font-bold text-lg">IB</span>
          </div>
          <span className="hidden sm:inline font-bold text-xl text-ibkr-navy tracking-tight">Interactive Brokers</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-1">
          {/* Products Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 rounded-lg text-ibkr-gray-700 font-semibold hover:bg-ibkr-light-blue hover:text-ibkr-blue transition-all duration-200 flex items-center border border-transparent hover:border-ibkr-blue">
              Products <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <div className="hidden group-hover:block absolute left-0 mt-0 w-56 bg-white border-2 border-ibkr-gray-300 rounded-lg shadow-lg z-50">
              <Link to="/trading" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold border-b border-ibkr-gray-200 transition-colors duration-150">Trading Platforms</Link>
              <Link to="/platforms" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold border-b border-ibkr-gray-200 transition-colors duration-150">All Platforms</Link>
              <Link to="/features" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold transition-colors duration-150">Features</Link>
            </div>
          </div>

          <Link to="/market-data" className="px-4 py-2 rounded-lg text-ibkr-gray-700 font-semibold hover:bg-ibkr-light-blue hover:text-ibkr-blue transition-all duration-200 border border-transparent hover:border-ibkr-blue">Market Data</Link>
          <Link to="/pricing" className="px-4 py-2 rounded-lg text-ibkr-gray-700 font-semibold hover:bg-ibkr-light-blue hover:text-ibkr-blue transition-all duration-200 border border-transparent hover:border-ibkr-blue">Pricing</Link>
          
          {/* Support Dropdown */}
          <div className="relative group">
            <button className="px-4 py-2 rounded-lg text-ibkr-gray-700 font-semibold hover:bg-ibkr-light-blue hover:text-ibkr-blue transition-all duration-200 flex items-center border border-transparent hover:border-ibkr-blue">
              Support <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <div className="hidden group-hover:block absolute left-0 mt-0 w-56 bg-white border-2 border-ibkr-gray-300 rounded-lg shadow-lg z-50">
              <a href="#" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold border-b border-ibkr-gray-200 transition-colors duration-150">Help Center</a>
              <a href="#" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold border-b border-ibkr-gray-200 transition-colors duration-150">API Documentation</a>
              <a href="#" className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue font-semibold transition-colors duration-150">Community</a>
            </div>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/login" className="px-5 py-2.5 text-ibkr-blue font-semibold hover:bg-ibkr-light-blue rounded-lg border border-ibkr-blue transition-all duration-200">
            Sign In
          </Link>
          <Link to="/login" className="btn-primary">
            Open Account
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="lg:hidden p-2 rounded-lg hover:bg-ibkr-gray-100 transition-colors duration-200">
          {isOpen ? <X className="w-6 h-6 text-ibkr-navy" /> : <Menu className="w-6 h-6 text-ibkr-navy" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t-2 border-ibkr-gray-300">
          <div className="container-max py-4 space-y-2">
            <MobileMenuItem to="/trading" label="Trading Platforms" />
            <MobileMenuItem to="/platforms" label="All Platforms" />
            <MobileMenuItem to="/features" label="Features" />
            <MobileMenuItem to="/market-data" label="Market Data" />
            <MobileMenuItem to="/pricing" label="Pricing" />
            <div className="pt-4 space-y-3 border-t-2 border-ibkr-gray-300">
              <Link to="/login" className="block px-5 py-2.5 text-ibkr-blue font-semibold hover:bg-ibkr-light-blue rounded-lg border border-ibkr-blue transition-all duration-200">
                Sign In
              </Link>
              <Link to="/login" className="block px-5 py-2.5 bg-gradient-to-b from-ibkr-blue to-ibkr-navy text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 text-center border border-ibkr-navy">
                Open Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function MobileMenuItem({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block px-5 py-3 text-ibkr-gray-700 hover:bg-ibkr-light-blue hover:text-ibkr-blue rounded-lg font-semibold border border-transparent hover:border-ibkr-blue transition-all duration-200">
      {label}
    </Link>
  )
}
