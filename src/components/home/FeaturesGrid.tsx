import { TrendingUp, Shield, Globe, Zap, BarChart3, Users, Lock, Smartphone } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: 'Advanced Trading',
    description: 'Professional-grade tools for stocks, options, futures, forex and more.'
  },
  {
    icon: Shield,
    title: 'Secure & Protected',
    description: 'Bank-level security and SIPC protection up to $500,000 per account.'
  },
  {
    icon: Globe,
    title: 'Global Markets',
    description: 'Access to 150+ markets across 30+ countries with low commissions.'
  },
  {
    icon: Zap,
    title: 'Ultra-Low Costs',
    description: 'Competitive commissions and forex spreads starting at 0.2 pips.'
  },
  {
    icon: BarChart3,
    title: 'Market Research',
    description: 'Real-time data, analysis tools, and professional research reports.'
  },
  {
    icon: Users,
    title: '24/5 Support',
    description: 'Expert support team available around the clock, 5 days a week.'
  },
  {
    icon: Lock,
    title: 'Risk Management',
    description: 'Advanced order types and portfolio margin for risk control.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Trading',
    description: 'Trade on the move with our powerful native mobile applications.'
  }
]

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-gradient-to-b from-ibkr-gray-50 to-white border-b-2 border-ibkr-gray-300">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="section-title text-ibkr-navy">Why Choose Interactive Brokers</h2>
          <p className="text-lg text-ibkr-gray-600 max-w-2xl mx-auto font-medium">
            Everything you need to trade like a professional with competitive pricing and powerful tools.
          </p>
        </div>

        <div className="grid-auto-fit">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="card-premium p-10 group hover:border-ibkr-blue hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-ibkr-light-blue to-blue-100 rounded-lg mb-6 border-2 border-ibkr-blue/30 group-hover:border-ibkr-blue group-hover:shadow-md transition-all duration-300">
                  <Icon className="w-7 h-7 text-ibkr-blue" />
                </div>
                <h3 className="text-xl font-bold text-ibkr-navy mb-4 group-hover:text-ibkr-blue transition-colors duration-300">{feature.title}</h3>
                <p className="text-ibkr-gray-600 leading-relaxed font-medium">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
