import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  Building2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const contactCards = [
  {
    icon: Phone,
    title: "Call Us",
    detail: "+91 98765 43210",
    sub: "Mon – Sat, 9 AM – 7 PM IST",
    color: "text-gold-600",
    bg: "bg-gold-50",
    border: "border-gold-200/60",
  },
  {
    icon: Mail,
    title: "Email Us",
    detail: "reservations@hampistays.com",
    sub: "We reply within 24 hours",
    color: "text-sunset-600",
    bg: "bg-sunset-50",
    border: "border-sunset-200/60",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    detail: "123 Heritage Route, Kamalapura",
    sub: "Hampi, Karnataka 583239",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
  },
];

const helpTopics = [
  {
    icon: MessageSquare,
    title: "Booking Assistance",
    desc: "Need help reserving a luxury stay? Our concierge team is ready to curate the perfect experience for you.",
  },
  {
    icon: Headphones,
    title: "24/7 Guest Support",
    desc: "Already checked in? Our on-ground team is available around the clock for any in-stay requests or emergencies.",
  },
  {
    icon: Building2,
    title: "Partner With Us",
    desc: "Own a premium property in Hampi? Join our curated network of heritage resorts and luxury homestays.",
  },
];

export function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-sand-50">
      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gold-200/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-sunset-200/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-100/60 backdrop-blur-md border border-gold-200/60 rounded-full px-5 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-gold-700">
                Get in Touch
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-serif font-bold text-navy-950 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            We'd Love to{" "}
            <span className="text-gold-600 italic">Hear From You</span>
          </motion.h1>

          <motion.p
            className="text-lg text-navy-800/60 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Whether you're planning your dream Hampi escape, have questions
            about our luxury stays, or want to partner with us — our team is
            here for you.
          </motion.p>
        </div>
      </section>

      {/* ── CONTACT CARDS ── */}
      <section className="container mx-auto px-4 md:px-6 -mt-4 mb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactCards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className={`group p-8 rounded-3xl bg-white/80 backdrop-blur-xl border ${card.border} shadow-sm hover:shadow-luxury transition-all duration-500 hover:-translate-y-1`}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-lg font-bold text-navy-950 mb-2">
                {card.title}
              </h3>
              <p className="text-navy-950 font-semibold text-base mb-1">
                {card.detail}
              </p>
              <p className="text-sm text-navy-800/50">{card.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FORM + HELP TOPICS ── */}
      <section className="container mx-auto px-4 md:px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Left: Contact Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-sand-200/60 shadow-sm p-8 md:p-12 relative overflow-hidden">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-100/40 rounded-full blur-[60px] pointer-events-none" />

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 relative z-10"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-navy-950 mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-navy-800/60 max-w-md mx-auto">
                    Thank you for reaching out. Our concierge team will get back
                    to you within 24 hours with a personalized response.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="mt-8 text-gold-600 font-bold hover:text-sunset-500 transition-colors"
                  >
                    Send another message →
                  </button>
                </motion.div>
              ) : (
                <div className="relative z-10">
                  <h2 className="text-2xl font-serif font-bold text-navy-950 mb-2">
                    Send Us a Message
                  </h2>
                  <p className="text-navy-800/50 mb-8">
                    Fill out the form below and we'll respond promptly.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Input
                        label="Full Name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Input
                      label="Subject"
                      type="text"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      required
                    />

                    <div>
                      <label className="block text-sm font-bold text-navy-950 mb-2">
                        Your Message
                      </label>
                      <textarea
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        required
                        className="w-full px-5 py-4 bg-sand-50 border border-sand-200 rounded-2xl text-navy-950 placeholder:text-navy-800/30 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all duration-300 resize-none"
                        placeholder="Tell us how we can help..."
                      />
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg mt-2" disabled={loading}>
                      <Send className={`w-5 h-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                    {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                  </form>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Help Topics + Hours */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Help Topics */}
            {helpTopics.map((topic, i) => (
              <motion.div
                key={topic.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-sand-200/50 hover:border-gold-200/60 hover:shadow-sm transition-all duration-300 group"
              >
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gold-50 flex items-center justify-center shrink-0 group-hover:bg-gold-100 transition-colors">
                    <topic.icon className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-950 mb-1">
                      {topic.title}
                    </h4>
                    <p className="text-sm text-navy-800/50 leading-relaxed">
                      {topic.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Office Hours */}
            <div className="p-6 rounded-2xl bg-navy-950 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gold-400" />
                  </div>
                  <h4 className="font-bold text-lg">Office Hours</h4>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-sand-200/80">Monday – Friday</span>
                    <span className="font-semibold text-gold-400">
                      9:00 AM – 7:00 PM
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sand-200/80">Saturday</span>
                    <span className="font-semibold text-gold-400">
                      10:00 AM – 5:00 PM
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-sand-200/80">Sunday</span>
                    <span className="font-semibold text-sunset-400">
                      Closed
                    </span>
                  </li>
                  <li className="pt-3 border-t border-white/10 flex justify-between">
                    <span className="text-sand-200/80">Guest Emergency</span>
                    <span className="font-semibold text-emerald-400">
                      24/7
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
