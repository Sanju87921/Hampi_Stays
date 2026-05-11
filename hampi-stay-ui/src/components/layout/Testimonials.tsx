import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Priya Raghavan",
    role: "Travel Blogger · Mumbai",
    content:
      "Waking up in an eco-cottage built between Hampi's ancient boulders, with the Tungabhadra murmuring outside — it felt like time travel. The guided temple walk at sunrise was worth every rupee. Truly India's hidden gem.",
    // Indian woman portrait
    avatar: "https://ui-avatars.com/api/?name=Priya+Raghavan&background=D4AF37&color=fff",
    rating: 5,
    stay: "Evolve Back Kamalapura Palace",
  },
  {
    id: 2,
    name: "Vikram Malhotra",
    role: "Architecture Photographer · Bengaluru",
    content:
      "The level of curation here is unmatched. Every resort listed feels like a secret find. Their heritage walk was the highlight of our trip.",
    avatar: "https://ui-avatars.com/api/?name=Vikram+Malhotra&background=0A0F1E&color=fff",
    rating: 5,
    stay: "Hampi Boutique Villa",
  },
  {
    id: 3,
    name: "Elena Petrov",
    role: "Honeymooners · Berlin, Germany",
    content:
      "Seamless booking and impeccable service. The concierge helped us arrange a private sunrise breakfast at Matanga Hill. Simply magical.",
    avatar: "https://ui-avatars.com/api/?name=Elena+Petrov&background=D4AF37&color=fff",
    rating: 5,
    stay: "Hampi's Boulders Resort & Spa",
  },
  {
    id: 4,
    name: "Ananya Rao",
    role: "Yoga Retreat Organiser · Bangalore",
    content:
      "I've been to Hampi four times, but this was the first time I felt I truly saw its soul. The boutique stay they recommended was stunning.",
    avatar: "https://ui-avatars.com/api/?name=Ananya+Rao&background=0A0F1E&color=fff",
    rating: 5,
    stay: "Heritage Resort Hampi",
  },
];

export function Testimonials() {
  return (
    <section className="py-32 md:py-48 bg-sand-50 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold-200/10 rounded-full blur-[150px] opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none animate-float-slow" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-sand-300/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          {/* Left heading */}
          <div className="lg:w-1/3 lg:sticky lg:top-32">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-gold-500 font-bold tracking-[0.15em] uppercase text-sm mb-4 block"
            >
              Guest Stories
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 text-navy-950 leading-tight"
            >
              Echoes of Delight
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-editorial ml-0 mb-10"
            >
              From honeymooners to heritage photographers — here is what real guests say about their time in the heart of the Vijayanagara empire.
            </motion.p>

            {/* Platform rating badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              {[
                { platform: "Google Reviews", rating: "4.9", count: "2,100+" },
                { platform: "TripAdvisor", rating: "5.0", count: "870+" },
                { platform: "Booking.com", rating: "9.4/10", count: "540+" },
              ].map((item) => (
                <div key={item.platform} className="flex items-center justify-between bg-sand-100/80 backdrop-blur-md rounded-xl px-4 py-3 border border-sand-200 shadow-sm">
                  <span className="text-sm text-navy-800 font-medium">{item.platform}</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                    <span className="text-navy-950 font-bold text-sm">{item.rating}</span>
                    <span className="text-navy-600 text-xs">({item.count})</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: reviews grid */}
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="bg-sand-100 border border-sand-200 shadow-sm p-8 rounded-[2rem] relative group hover:-translate-y-2 hover:shadow-luxury transition-all duration-500 flex flex-col"
              >
                <Quote className="w-10 h-10 text-gold-500/10 absolute top-7 right-7 transition-transform duration-500 group-hover:scale-110 group-hover:text-gold-500/20" />

                <div className="flex gap-1 mb-5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold-500 fill-gold-500" />
                  ))}
                </div>

                <p className="text-[#5F6B85] text-sm md:text-[1.0625rem] leading-[1.8] font-light tracking-[0.01em] mb-6 relative z-10 flex-1">
                  "{testimonial.content}"
                </p>

                {/* Stayed at */}
                <div className="mb-5">
                  <span className="text-[10px] font-bold text-navy-600/70 uppercase tracking-widest">Stayed at</span>
                  <p className="text-gold-600 text-xs font-semibold mt-0.5">{testimonial.stay}</p>
                </div>

                <div className="flex items-center gap-4 pt-5 border-t border-sand-200">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover border-2 border-gold-300"
                  />
                  <div>
                    <h4 className="font-bold text-navy-950 tracking-wide text-sm">{testimonial.name}</h4>
                    <p className="text-navy-600 text-xs font-medium mt-0.5">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
