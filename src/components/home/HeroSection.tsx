import { Link } from 'react-router-dom'
import { ChevronRight, Play, TrendingUp } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-40 bg-gradient-to-br from-ibkr-dark via-ibkr-navy to-ibkr-blue">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ibkr-light-blue rounded-full mix-blend-multiply blur-3xl opacity-5 -mr-24 -mt-24"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-ibkr-blue rounded-full mix-blend-multiply blur-3xl opacity-10 -ml-40 -mb-40"></div>
      
      <div className="container-max relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="text-white animate-fade-in">
            <div className="inline-block mb-6 px-4 py-2 bg-white/10 border border-white/30 rounded-xl backdrop-blur-sm">
              <span className="text-sm font-semibold text-red-100">Professional Trading Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-8 leading-tight tracking-tight">
              Trade with <span className="bg-gradient-to-r from-red-200 to-white bg-clip-text text-transparent">Confidence</span>
            </h1>
            <p className="text-lg text-red-100 mb-10 leading-relaxed max-w-lg font-medium">
              Access global markets 24/5 with advanced tools, competitive pricing, and professional-grade market research. Trade stocks, options, futures, and forex on intuitive platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/login" className="btn-primary bg-white text-ibkr-navy hover:bg-red-50 flex items-center justify-center shadow-lg border-0">
                Open Account
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
              <button className="btn-outline bg-transparent text-white border-2 border-white/50 hover:bg-white/10 hover:border-white flex items-center justify-center">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>

            {/* Stats with dividers */}
            <div className="flex flex-col sm:flex-row gap-10 pt-10 border-t-2 border-white/20">
              <div className="flex-1">
                <div className="text-4xl font-bold mb-2 text-white">$244B+</div>
                <p className="text-red-100 text-sm font-medium">Customer Assets Under Management</p>
              </div>
              <div className="h-12 hidden sm:block w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
              <div className="flex-1">
                <div className="text-4xl font-bold mb-2 text-white">150+</div>
                <p className="text-red-100 text-sm font-medium">Markets Across the Globe</p>
              </div>
              <div className="h-12 hidden sm:block w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
              <div className="flex-1">
                <div className="text-4xl font-bold mb-2 text-white">24/5</div>
                <p className="text-red-100 text-sm font-medium">Continuous Market Access</p>
              </div>
            </div>
          </div>

          {/* Visual - Dashboard Preview */}
          <div className="hidden lg:block relative h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl backdrop-blur-md border-2 border-white/30 p-8 animate-slide-in shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/20 to-transparent border-b border-white/20 rounded-t-lg flex items-center px-6">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg h-full flex flex-col items-center justify-center pt-8">
                <div className="text-center w-full">
                  <TrendingUp className="w-16 h-16 mx-auto text-red-200 mb-4 opacity-80" />
                  <div className="text-red-100 mb-8 text-sm font-semibold">Trading Dashboard Overview</div>
                  
                  <div className="grid grid-cols-3 gap-4 px-6">
                    {[
                      { label: 'Equities', value: '$45.2M' },
                      { label: 'Options', value: '$12.8M' },
                      { label: 'Futures', value: '$8.5M' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/10 border border-white/20 rounded-lg p-4">
                        <span className="text-red-100 text-xs font-semibold block mb-2">{item.label}</span>
                        <span className="text-white text-lg font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
