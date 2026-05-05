import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-sand-50 text-navy-800 pt-32 pb-12 border-t border-sand-200 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-200/20 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Top brand strip */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-20 pb-16 border-b border-sand-200/80">
          <Link to="/" className="inline-block group relative">
            {/* Subtle aura behind the full logo */}
            <div className="absolute inset-0 bg-gold-500/10 blur-[40px] rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <img 
              src="/logo-full.png" 
              alt="HampiStays Luxury Heritage" 
              className="relative z-10 w-72 md:w-80 h-auto object-contain transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-[1.05] drop-shadow-2xl opacity-90 group-hover:opacity-100"
            />
          </Link>
          <div className="max-w-md md:text-right">
            <p className="text-sm leading-relaxed text-navy-800/80 mb-6">
              Experience the pinnacle of luxury eco-tourism in the heart of the ancient Vijayanagara empire. Our mission is to preserve the heritage of Hampi while providing world-class hospitality and sustainable travel experiences.
            </p>
            <div className="flex flex-col md:items-end gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">Join the Exclusive Circle</span>
              <div className="flex w-full max-w-xs gap-2">
                <input 
                  type="email" 
                  placeholder="Email for rare updates" 
                  className="flex-grow bg-white/50 border border-sand-200 rounded-full px-5 py-2.5 text-xs focus:outline-none focus:border-gold-500 transition-all placeholder:text-navy-800/30"
                />
                <button className="bg-navy-950 text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gold-500 hover:text-navy-950 transition-all shadow-sm">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-4">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#"
                className="px-5 py-2.5 rounded-full bg-sand-100 hover:bg-gold-500 hover:text-navy-950 transition-all duration-300 text-xs tracking-wider uppercase font-bold border border-sand-200 hover:border-gold-500"
              >
                Instagram
              </a>
              <a
                href="#"
                className="px-5 py-2.5 rounded-full bg-sand-100 hover:bg-gold-500 hover:text-navy-950 transition-all duration-300 text-xs tracking-wider uppercase font-bold border border-sand-200 hover:border-gold-500"
              >
                Twitter
              </a>
              <a
                href="#"
                className="px-5 py-2.5 rounded-full bg-sand-100 hover:bg-gold-500 hover:text-navy-950 transition-all duration-300 text-xs tracking-wider uppercase font-bold border border-sand-200 hover:border-gold-500"
              >
                Facebook
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-navy-950 font-serif font-bold mb-6 uppercase tracking-wider text-base">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/resorts" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Our Resorts</Link></li>
              <li><Link to="/experiences" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Experiences</Link></li>
              <li><Link to="/about" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Our Story</Link></li>
              <li><Link to="/gallery" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Gallery</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-navy-950 font-serif font-bold mb-6 uppercase tracking-wider text-base">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/privacy" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Terms of Service</Link></li>
              <li><Link to="/contact" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Contact Us</Link></li>
              <li><a href="#" className="text-navy-900 font-semibold hover:text-gold-600 transition-colors text-base">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="text-navy-950 font-serif font-bold mb-6 uppercase tracking-wider text-base">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <span className="text-base font-semibold text-navy-900">123 Heritage Route, Kamalapura, Hampi, Karnataka 583239</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-600 shrink-0" />
                <span className="text-base font-semibold text-navy-900">+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-600 shrink-0" />
                <span className="text-base font-semibold text-navy-900">reservations@hampistays.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sand-200/60 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-navy-950/50">
          <p>© {new Date().getFullYear()} HampiStays. All rights reserved.</p>
          <p className="tracking-wider uppercase text-xs font-bold">Designed for Luxury & Heritage</p>
        </div>
      </div>
    </footer>
  );
}
