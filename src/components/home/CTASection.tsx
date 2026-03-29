import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const benefits = [
  'Zero account minimums',
  'Competitive commissions',
  'Access to 150+ markets',
  'Professional research tools',
  'Advanced order types',
  '24/5 expert support'
]

export default function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-ibkr-gray-50 border-b-2 border-ibkr-gray-300">
      <div className="container-max">
        <div className="bg-gradient-to-br from-ibkr-dark via-ibkr-navy to-ibkr-blue rounded-2xl p-16 lg:p-20 text-center border-2 border-white/20 shadow-2xl relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-multiply blur-3xl -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply blur-3xl -ml-40 -mb-40"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Start Trading?
            </h2>
            <p className="text-lg text-red-100 mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
              Open your account today and get instant access to professional trading tools,
              competitive pricing, and global market access.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-white/10 rounded-lg p-4 border border-white/20 hover:border-white/40 transition-all duration-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-white font-semibold">{benefit}</span>
                </div>
              ))}
            </div>

            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 px-12 py-4 bg-white text-ibkr-navy font-bold rounded-lg hover:bg-red-50 hover:shadow-xl transition-all duration-200 text-lg border-2 border-white shadow-lg"
            >
              Open Account Now
              <ArrowRight className="w-5 h-5" />
            </Link>

            <p className="text-red-100 text-sm mt-8 font-semibold">
              ⚡ Funding takes minutes. Start trading immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
