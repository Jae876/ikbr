import { Link } from 'react-router-dom'
import { TrendingUp, Shield, Globe, Zap, BarChart3, Users } from 'lucide-react'
import HeroSection from '@components/home/HeroSection'
import FeaturesGrid from '@components/home/FeaturesGrid'
import MarketStats from '@components/home/MarketStats'
import TestimonialsSection from '@components/home/TestimonialsSection'
import CTASection from '@components/home/CTASection'

export default function HomePage() {
  return (
    <div className="bg-white">
      <HeroSection />
      <MarketStats />
      <FeaturesGrid />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}
