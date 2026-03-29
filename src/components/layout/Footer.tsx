import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-ibkr-gray-900 text-ibkr-gray-300 mt-20 border-t-2 border-ibkr-gray-800">
      {/* Main Footer */}
      <div className="container-max py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* About */}
          <div>
            <h3 className="font-bold text-white mb-6 text-lg border-b-2 border-ibkr-blue pb-3">About IB</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Company Info</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Careers</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Newsroom</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Awards</a></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-bold text-white mb-6 text-lg border-b-2 border-ibkr-blue pb-3">Products</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Trading Platforms</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Mobile Apps</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">API</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Market Data</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-white mb-6 text-lg border-b-2 border-ibkr-blue pb-3">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Help Center</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Documentation</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Community</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-6 text-lg border-b-2 border-ibkr-blue pb-3">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Disclosures</a></li>
              <li><a href="#" className="hover:text-white hover:translate-x-1 transition duration-200">Compliance</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-6 text-lg border-b-2 border-ibkr-blue pb-3">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 group">
                <MessageCircle className="w-5 h-5 text-ibkr-blue group-hover:text-white transition duration-200" />
                <span className="text-sm text-ibkr-gray-400 group-hover:text-white transition duration-200">WhatsApp</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <Send className="w-5 h-5 text-ibkr-blue group-hover:text-white transition duration-200" />
                <span className="text-sm text-ibkr-gray-400 group-hover:text-white transition duration-200">Telegram</span>
              </li>
              <li className="flex items-center space-x-3 group pt-3 border-t border-ibkr-gray-700">
                <Phone className="w-5 h-5 text-ibkr-blue group-hover:text-white transition duration-200" />
                <a href="tel:+1-312-542-6901" className="hover:text-white transition duration-200">+1-312-542-6901</a>
              </li>
              <li className="flex items-center space-x-3 group">
                <Mail className="w-5 h-5 text-ibkr-blue group-hover:text-white transition duration-200" />
                <a href="mailto:info@ibkr.com" className="hover:text-white transition duration-200">info@ibkr.com</a>
              </li>
              <li className="flex items-start space-x-3 group">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0 text-ibkr-blue group-hover:text-white transition duration-200" />
                <span className="group-hover:text-white transition duration-200">Chicago, IL 60606</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-ibkr-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-6 border-b border-ibkr-gray-800">
            <div className="flex items-center space-x-3 mb-6 md:mb-0 group">
              <div className="w-8 h-8 bg-gradient-to-br from-ibkr-blue to-ibkr-navy rounded-lg flex items-center justify-center shadow-md border border-ibkr-blue group-hover:shadow-lg transition duration-200">
                <span className="text-white font-bold text-sm">IB</span>
              </div>
              <span className="text-white font-bold text-lg">Interactive Brokers</span>
            </div>
          </div>
          
          <p className="text-ibkr-gray-500 text-sm text-center font-medium leading-relaxed">
            <span className="block mb-3 text-white font-bold">Interactive Brokers LLC</span>
            Is a member NYSE - FINRA - SIPC and regulated by the US Securities and Exchange Commission and the Commodity Futures Trading Commission.
            <br className="block mt-4" />
            <span className="text-xs text-ibkr-gray-600">&copy; {currentYear} Interactive Brokers LLC. All rights reserved.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
