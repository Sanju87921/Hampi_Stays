import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { RefreshCcw, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

interface SectionProps {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ id, number, title, children }: SectionProps) {
  return (
    <motion.section
      id={id}
      custom={parseInt(number)}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="scroll-mt-32"
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="text-xs font-bold text-gold-500 bg-gold-50 border border-gold-200/60 rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1">
          {number}
        </span>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-navy-950">
          {title}
        </h2>
      </div>
      <div className="ml-12 text-navy-800/70 leading-relaxed space-y-4 text-[15px]">
        {children}
      </div>
    </motion.section>
  );
}

const tocItems = [
  { id: "overview", label: "Overview" },
  { id: "cancellation", label: "Cancellation Timeline" },
  { id: "processing", label: "Refund Processing" },
  { id: "exceptions", label: "Exceptions & Force Majeure" },
  { id: "no-shows", label: "No-Shows & Early Departures" },
  { id: "modifications", label: "Booking Modifications" },
];

export function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-sand-50">
      {/* ── HERO ── */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-200/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-navy-950/5 backdrop-blur-md border border-navy-950/10 rounded-full px-5 py-2 mb-6">
              <RefreshCcw className="w-4 h-4 text-navy-950/50" />
              <span className="text-xs font-bold tracking-widest uppercase text-navy-950/60">
                Policies
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-serif font-bold text-navy-950 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Cancellation & <span className="text-gold-600 italic">Refund Policy</span>
          </motion.h1>

          <motion.p
            className="text-lg text-navy-800/60 max-w-2xl mx-auto leading-relaxed mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            We strive to offer flexibility while respecting our resort partners. Please review our comprehensive cancellation and refund guidelines below.
          </motion.p>

          <motion.p
            className="text-sm text-navy-800/40 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Last updated: May 1, 2026
          </motion.p>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <section className="container mx-auto px-4 md:px-6 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sticky TOC Sidebar */}
          <motion.aside
            className="lg:col-span-3 hidden lg:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="sticky top-32 bg-white/70 backdrop-blur-xl rounded-2xl border border-sand-200/60 p-6">
              <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider mb-4">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {tocItems.map((item, i) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-navy-800/60 hover:text-gold-600 hover:bg-gold-50/50 transition-all duration-200 font-medium"
                  >
                    <span className="text-xs text-navy-800/30 font-bold w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">
            {/* Quick Summary Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-4 p-6 rounded-2xl bg-gold-50 border border-gold-200/60"
            >
              <CheckCircle2 className="w-6 h-6 text-gold-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-navy-950 mb-1">
                  The 48-Hour Rule
                </h4>
                <p className="text-sm text-navy-800/60 leading-relaxed">
                  In short, you can cancel any booking for a full 100% refund as long as you do so at least 48 hours before your scheduled check-in time.
                </p>
              </div>
            </motion.div>

            <PolicySection id="overview" number="1" title="Overview">
              <p>
                HampiStays aims to provide a fair and transparent cancellation process for both our guests and our resort partners. Because our luxury properties often sell out and have limited inventory, last-minute cancellations significantly impact their operations.
              </p>
              <p>
                By completing a booking on the HampiStays platform, you agree to the cancellation terms outlined in this document.
              </p>
            </PolicySection>

            <PolicySection id="cancellation" number="2" title="Standard Cancellation Timeline">
              <p>
                Our standard cancellation policy is simple and designed to give you peace of mind while protecting our hosts.
              </p>
              <ul className="list-disc pl-6 space-y-3 mt-2">
                <li>
                  <span className="font-semibold text-emerald-600">Up to 48 Hours Before Check-in:</span> You may cancel your reservation completely free of charge. You will receive a <span className="font-bold text-navy-950">100% full refund</span> to your original payment method. The 48-hour window is calculated based on the property's stated check-in time in the local timezone (IST).
                </li>
                <li>
                  <span className="font-semibold text-red-500">Within 48 Hours of Check-in:</span> Cancellations made less than 48 hours before the scheduled check-in time are non-refundable. You will be charged <span className="font-bold text-navy-950">100% of the total booking cost</span>. This policy compensates the resort for the inability to rebook the room on short notice.
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="processing" number="3" title="Refund Processing">
              <p>
                When a valid cancellation is initiated through your HampiStays dashboard:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Our system instantly triggers a refund request to our payment processor (Razorpay).
                </li>
                <li>
                  Approved refunds are credited back to the <span className="font-semibold text-navy-950">original payment source</span> (e.g., Credit Card, Debit Card, Net Banking, or UPI). We cannot process refunds to alternate accounts.
                </li>
                <li>
                  Please allow <span className="font-semibold text-navy-950">5 to 7 business days</span> for the funds to reflect in your bank statement, depending on your bank's processing times.
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="exceptions" number="4" title="Exceptions & Force Majeure">
              <p>
                We understand that emergencies happen. In the event of extenuating circumstances, the standard cancellation policy may be overridden. These situations include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Government-mandated travel restrictions or lockdowns affecting Hampi or your point of origin.
                </li>
                <li>
                  Severe weather alerts, natural disasters, or acts of God that make it impossible to reach the destination safely.
                </li>
                <li>
                  Documented severe medical emergencies (requires official medical certification).
                </li>
              </ul>
              <p>
                If you believe your situation qualifies as an exception, please contact our support team immediately at <span className="font-semibold text-navy-950">support@hampistays.com</span> before your check-in time. Exceptions are granted at the sole discretion of HampiStays management.
              </p>
            </PolicySection>

            <PolicySection id="no-shows" number="5" title="No-Shows & Early Departures">
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-semibold text-navy-950">No-Shows:</span> If you fail to arrive at the property on the day of check-in without prior notice, the booking will be marked as a "No-Show" and is completely non-refundable.
                </li>
                <li>
                  <span className="font-semibold text-navy-950">Early Departures:</span> If you choose to leave the resort before your scheduled check-out date, refunds for the unused nights are at the sole discretion of the resort owner and are generally not granted unless previously agreed upon.
                </li>
              </ul>
            </PolicySection>

            <PolicySection id="modifications" number="6" title="Booking Modifications">
              <p>
                If you wish to change your travel dates rather than cancel:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Date modifications requested <span className="font-semibold">more than 48 hours</span> before check-in can usually be accommodated free of charge, subject to room availability and seasonal price differences.
                </li>
                <li>
                  Modifications requested within 48 hours of check-in are treated as cancellations and are subject to the standard cancellation fees outlined above.
                </li>
              </ul>
            </PolicySection>
          </div>
        </div>
      </section>
    </main>
  );
}
