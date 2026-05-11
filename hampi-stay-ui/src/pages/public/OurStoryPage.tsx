import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart,
  Mountain,
  Users,
  Gem,
  Globe,
  Leaf,
  Shield,
  ArrowRight,
  Star,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const milestones = [
  { year: "2019", title: "The Seed", desc: "Two friends, one sunset at Matanga Hill, and a dream to share Hampi's magic with the world." },
  { year: "2020", title: "First Listing", desc: "Our first partner property goes live — a charming riverside cottage with 3 rooms and infinite views." },
  { year: "2021", title: "Growing Community", desc: "50+ properties onboarded. We launch curated experiences: heritage walks, sunrise treks, and cooking classes." },
  { year: "2022", title: "Tech & Trust", desc: "Real-time availability, secure payments, and verified reviews — building the infrastructure travelers deserve." },
  { year: "2023", title: "Luxury Redefined", desc: "Premium tier launches with Evolve Back, Boulders Resort, and boutique heritage villas. Average rating: 4.8★." },
  { year: "2024", title: "10,000 Guests", desc: "A milestone that humbles us. 10,000 travelers have experienced Hampi through our platform." },
  { year: "2025", title: "Sustainability Pledge", desc: "Carbon-neutral operations, eco-certified partners, and a commitment to preserving Hampi's heritage for future generations." },
  { year: "2026", title: "The Future", desc: "Expanding to Badami, Aihole, and Pattadakal — building Karnataka's premier heritage travel ecosystem." },
];

const values = [
  {
    icon: Heart,
    title: "Passion for Heritage",
    desc: "Every property we list tells a story of the Vijayanagara empire, the Tungabhadra river, and the timeless boulders of Hampi.",
    color: "text-sunset-600",
    bg: "bg-sunset-50",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    desc: "Verified properties, honest reviews, transparent pricing — no hidden fees, no surprises. Just authentic luxury.",
    color: "text-gold-600",
    bg: "bg-gold-50",
  },
  {
    icon: Leaf,
    title: "Sustainable Tourism",
    desc: "We partner exclusively with eco-conscious properties committed to preserving Hampi's UNESCO World Heritage environment.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Gem,
    title: "Curated Excellence",
    desc: "Every resort is personally inspected by our team. We accept fewer than 30% of applications to maintain our luxury standard.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const team = [
  {
    name: "Arjun Varma",
    role: "Co-Founder & CEO",
    desc: "Former ITC Hotels executive. Fell in love with Hampi during a solo backpacking trip and never left.",
    image: "https://ui-avatars.com/api/?name=Arjun+Varma&background=0A0F1E&color=fff",
  },
  {
    name: "Priya Deshmukh",
    role: "Co-Founder & COO",
    desc: "Heritage conservation architect turned entrepreneur. Led UNESCO restoration projects across Karnataka.",
    image: "https://ui-avatars.com/api/?name=Priya+Deshmukh&background=D4AF37&color=fff",
  },
  {
    name: "Karthik Reddy",
    role: "Head of Partnerships",
    desc: "Born in Hospet, raised in Hampi. Knows every resort owner, every hidden temple, and every sunset spot.",
    image: "https://ui-avatars.com/api/?name=Karthik+Reddy&background=0A0F1E&color=fff",
  },
  {
    name: "Meera Iyer",
    role: "Head of Guest Experience",
    desc: "10 years at Taj Hotels. Designs bespoke itineraries that transform trips into life-changing experiences.",
    image: "https://ui-avatars.com/api/?name=Meera+Iyer&background=D4AF37&color=fff",
  },
];

const stats = [
  { value: "200+", label: "Luxury Properties" },
  { value: "10,000+", label: "Happy Guests" },
  { value: "4.8★", label: "Average Rating" },
  { value: "7", label: "Years of Heritage" },
];

export function OurStoryPage() {
  return (
    <main className="min-h-screen bg-sand-50">
      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold-200/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-sunset-200/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-100/60 backdrop-blur-md border border-gold-200/60 rounded-full px-5 py-2 mb-6">
              <Mountain className="w-4 h-4 text-gold-600" />
              <span className="text-xs font-bold tracking-widest uppercase text-gold-700">
                Our Journey
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-navy-950 mb-6 leading-[1.1]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            The Story Behind{" "}
            <span className="text-gold-600 italic">HampiStays</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-navy-800/60 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Born from a deep love for Hampi's ancient heritage, we set out to
            create the most trusted platform connecting discerning travelers with
            the finest luxury stays in one of India's most extraordinary
            destinations.
          </motion.p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="container mx-auto px-4 md:px-6 mb-20">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 md:p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-sand-200/50"
            >
              <p className="text-3xl md:text-4xl font-bold text-navy-950 mb-1 font-serif">
                {stat.value}
              </p>
              <p className="text-sm text-navy-800/50 font-semibold">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── ORIGIN STORY ── */}
      <section className="container mx-auto px-4 md:px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-luxury">
              <img
                src="/images/hampi-2.png"
                alt="Hampi Landscape"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <span className="text-gold-400 text-xs font-bold tracking-widest uppercase">
                  Where It All Began
                </span>
                <p className="text-white font-serif text-2xl font-bold mt-2">
                  Matanga Hill, Hampi — 2019
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-6"
          >
            <span className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs">
              How It Started
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-950 leading-tight">
              Two Friends, One Sunset, and a{" "}
              <span className="text-gold-600 italic">Dream</span>
            </h2>
            <div className="space-y-4 text-navy-800/70 leading-relaxed text-[15px]">
              <p>
                It was January 2019. Arjun and Priya sat atop Matanga Hill,
                watching the sun set over the ancient Vijayanagara ruins. They
                had just spent a week trying to find quality accommodation in
                Hampi — navigating outdated listings, unreliable bookings, and
                properties that looked nothing like their photos.
              </p>
              <p>
                "Hampi deserves better," Priya said. And in that golden hour,
                HampiStays was born — not as a business idea, but as a promise
                to this extraordinary place and the travelers who seek it.
              </p>
              <p>
                We started by personally visiting every property within 30 km of
                the Virupaksha Temple. We met owners, inspected rooms, tested
                beds, and tasted food. Only those that met our exacting standards
                of comfort, authenticity, and hospitality made the cut.
              </p>
              <p>
                Today, HampiStays is Karnataka's premier luxury stays platform —
                but at our core, we're still those two friends on Matanga Hill,
                chasing sunsets and sharing Hampi's magic with the world.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MISSION / VALUES ── */}
      <section className="py-24 bg-sand-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-200/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
              What Drives Us
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-navy-950 mb-6">
              Our{" "}
              <span className="text-gold-600 italic">Values</span>
            </h2>
            <p className="text-navy-800/60 leading-relaxed text-lg">
              Every decision we make is guided by four core principles that
              define who we are and how we serve our guests and partners.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-sand-200/50 hover:shadow-luxury hover:-translate-y-1 transition-all duration-500 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${value.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <value.icon className={`w-6 h-6 ${value.color}`} />
                </div>
                <h3 className="text-xl font-bold text-navy-950 mb-3">
                  {value.title}
                </h3>
                <p className="text-navy-800/60 leading-relaxed text-[15px]">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-24 container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            Our Journey
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-navy-950 mb-6">
            Milestones That{" "}
            <span className="text-gold-600 italic">Define Us</span>
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Vertical line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-sand-200 md:-translate-x-px" />

          {milestones.map((item, i) => (
            <motion.div
              key={item.year}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className={`relative flex items-start gap-6 mb-12 ${
                i % 2 === 0
                  ? "md:flex-row"
                  : "md:flex-row-reverse"
              }`}
            >
              {/* Dot */}
              <div className="absolute left-6 md:left-1/2 w-3 h-3 rounded-full bg-gold-500 border-4 border-sand-50 -translate-x-1.5 md:-translate-x-1.5 top-1 z-10" />

              {/* Content */}
              <div
                className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
                  i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                }`}
              >
                <span className="text-gold-600 font-bold text-sm tracking-wider">
                  {item.year}
                </span>
                <h4 className="text-lg font-bold text-navy-950 mt-1 mb-2">
                  {item.title}
                </h4>
                <p className="text-navy-800/60 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="py-24 bg-sand-100 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sunset-200/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
              The People
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-navy-950 mb-6">
              Meet Our{" "}
              <span className="text-gold-600 italic">Team</span>
            </h2>
            <p className="text-navy-800/60 leading-relaxed text-lg">
              Hospitality veterans, heritage enthusiasts, and technology
              innovators — united by a shared love for Hampi.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="group rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl border border-sand-200/50 hover:shadow-luxury hover:-translate-y-1 transition-all duration-500"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[0.16,1,0.3,1] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-white font-bold text-lg">
                      {member.name}
                    </h4>
                    <p className="text-gold-400 text-xs font-bold tracking-wider uppercase">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-navy-800/60 leading-relaxed">
                    {member.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUSTAINABILITY ── */}
      <section className="py-24 container mx-auto px-4 md:px-6">
        <div className="bg-navy-950 rounded-[3rem] p-8 md:p-16 lg:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-gold-400 font-bold tracking-[0.2em] uppercase text-xs mb-4 block">Sustainability</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">Preserving the <span className="text-gold-400 italic">Eternal City</span></h2>
              <p className="text-sand-200/70 text-lg leading-relaxed mb-8">
                Hampi is not just a destination; it's a legacy. We believe that luxury and conservation should go hand in hand. 
                That's why we've launched the "Green Hampi Initiative" to ensure that every stay contributes to the restoration 
                and preservation of the UNESCO World Heritage site.
              </p>
              <ul className="space-y-4">
                {[
                  "1% of every booking goes to local temple restoration.",
                  "Zero single-use plastics across all partner properties by 2025.",
                  "Supporting 50+ local artisan families through curated experiences.",
                  "Regular heritage cleaning drives led by our team and guests."
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sand-100/90 font-medium">
                    <div className="w-2 h-2 rounded-full bg-gold-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute -inset-4 bg-gold-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src="/images/hampi-6.png" 
                alt="Conservation efforts" 
                className="relative rounded-[2rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 container mx-auto px-4 md:px-6">
        <motion.div
          className="relative rounded-[2.5rem] overflow-hidden bg-navy-950 p-12 md:p-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sunset-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <Globe className="w-10 h-10 text-gold-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
              Ready to Experience{" "}
              <span className="text-gold-400 italic">Hampi?</span>
            </h2>
            <p className="text-sand-200/70 max-w-2xl mx-auto leading-relaxed text-lg mb-10">
              Join thousands of discerning travelers who have discovered the
              magic of Hampi through our curated luxury stays.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/resorts"
                className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-gold hover:shadow-gold-lg uppercase tracking-wider text-sm"
              >
                Explore Resorts
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 border border-white/20 uppercase tracking-wider text-sm"
              >
                Contact Us
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex items-center justify-center gap-2 mt-10 text-sand-200/40">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="w-4 h-4 text-gold-400 fill-gold-400"
                  />
                ))}
              </div>
              <span className="text-sm font-medium ml-2">
                <Users className="w-4 h-4 inline mr-1" />
                Trusted by 10,000+ travelers
              </span>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
