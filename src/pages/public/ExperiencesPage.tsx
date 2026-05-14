import { useState, useEffect } from "react";
import { apiClient } from "../../utils/apiClient";
import { motion } from "framer-motion";
import { 
  Search, MapPin, Star, ArrowRight, 
  Award, SlidersHorizontal,
  Compass, History, Mountain, Sparkles, Camera, IndianRupee, X
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { ImmersiveBackground } from "../../components/layout/ImmersiveBackground";
import { PremiumIcon } from "../../components/ui/PremiumIcon";

const EXPERIENCE_IMAGES = [
  "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548013146-72479768bbaa?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?q=80&w=2070&auto=format&fit=crop"
];

interface Experience {
  id: string;
  title: string;
  description: string;
  price: number;
  durationHours: number;
  meetingPoint: string;
  images?: string[];
  guide: {
    user: { 
      name: string;
      avatar?: string;
    };
  };
}

export function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [guideServiceEnabled, setGuideServiceEnabled] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`).then(res => res.json());
      if (data && typeof data.guideServiceEnabled !== 'undefined') {
        setGuideServiceEnabled(data.guideServiceEnabled);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const categories = [
    { name: "All", icon: Compass },
    { name: "History", icon: History },
    { name: "Adventure", icon: Mountain },
    { name: "Architecture", icon: Sparkles },
  ];

  useEffect(() => {
    fetchSettings();
    const fetchExperiences = async () => {
      try {
        const data = await apiClient.get<Experience[]>('/experiences');
        setExperiences(data || []);
      } catch (err) {
        console.error("Failed to fetch experiences", err);
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, []);

  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         exp.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || exp.title.includes(selectedCategory) || exp.description.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (!guideServiceEnabled) {
    return (
      <div className="min-h-screen bg-sand-50 pt-40 pb-20 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <PremiumIcon icon={Compass} variant="sand" size="xl" className="mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-6">Service <span className="text-red-500 italic">Paused</span></h1>
            <p className="text-lg text-navy-950/60 leading-relaxed mb-10">
              Our curated Hampi experiences are currently paused for seasonal maintenance. 
              We'll be back with new storytellers and immersive journeys very soon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resorts">
                <Button className="h-14 px-8 rounded-2xl bg-navy-950 text-white w-full sm:w-auto">Explore Stays</Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-sand-200 text-navy-950 w-full sm:w-auto">About HampiStays</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-32">
      {/* Hero Section */}
      <section className="relative h-[65vh] flex items-center justify-center overflow-hidden">
        <ImmersiveBackground images={EXPERIENCE_IMAGES} interval={3000} />

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-gold-500/20 border border-gold-500/30 text-[10px] font-bold uppercase tracking-widest text-gold-400 mb-6 inline-block backdrop-blur-md">
              Hampi Expert Network
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight">
              Don't Just See Hampi. <br />
              <span className="italic text-gold-400">Experience Its Soul.</span>
            </h1>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative group mb-12">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl -m-2 opacity-0 group-focus-within:opacity-100 transition-all duration-500" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-luxury p-2">
                <div className="flex-1 flex items-center px-4 gap-3">
                  <Search className="w-5 h-5 text-navy-950/40" />
                  <input 
                    type="text" 
                    placeholder="Search tours, architecture, mythology..."
                    className="w-full h-12 bg-transparent text-navy-950 font-medium outline-none placeholder:text-navy-950/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="rounded-xl px-8 h-12 bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 transition-all border-none">
                  Explore
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-20 relative z-20">
        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-500",
                selectedCategory === cat.name
                  ? "bg-navy-950 text-white shadow-luxury scale-105"
                  : "bg-white text-navy-950/60 hover:bg-sand-100 shadow-sm"
              )}
            >
              <PremiumIcon 
                icon={cat.icon} 
                variant={selectedCategory === cat.name ? "gold" : "sand"} 
                size="sm" 
                animate={false} 
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-sand-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-serif font-bold text-navy-950">
              {filteredExperiences.length} <span className="text-navy-950/40">Available Experiences</span>
            </h2>
          </div>
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy-950/40 hover:text-navy-950 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Filter Results
          </button>
        </div>

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[500px] bg-white/50 rounded-[3rem] animate-pulse" />
            ))
          ) : (
            filteredExperiences.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[3rem] border border-sand-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 flex flex-col"
              >
                {/* Image Area */}
                <div className="relative h-72 overflow-hidden bg-sand-100">
                   <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   
                   {exp.images?.[0] ? (
                     <img 
                       src={exp.images[0]} 
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                       alt={exp.title}
                     />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center text-sand-300 bg-sand-100">
                        <Camera className="w-12 h-12 opacity-20" />
                     </div>
                   )}

                   <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                     <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-navy-950 uppercase tracking-widest shadow-sm">
                       {exp.durationHours} Hours
                     </span>
                   </div>
                   <div className="absolute bottom-6 left-6 z-20 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                     <p className="text-white text-sm font-medium flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-gold-400" /> {exp.meetingPoint}
                     </p>
                   </div>
                </div>

                {/* Content Area */}
                <div className="p-10 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-gold-500">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">4.9 (48 Reviews)</span>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-navy-950 mb-4 group-hover:text-gold-600 transition-colors">
                    {exp.title}
                  </h3>
                  
                  <p className="text-navy-950/50 text-sm leading-relaxed line-clamp-3 mb-8">
                    {exp.description}
                  </p>

                  <div className="mt-auto space-y-6">
                    <div className="flex items-center justify-between py-4 border-t border-sand-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center font-bold text-navy-950 text-xs shadow-inner uppercase overflow-hidden">
                          {exp.guide.user.avatar ? (
                            <img src={exp.guide.user.avatar} className="w-full h-full object-cover" />
                          ) : (
                            exp.guide.user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">Expert Guide</p>
                          <p className="text-sm font-bold text-navy-950 flex items-center gap-1">
                            {exp.guide.user.name} <Award className="w-3 h-3 text-gold-500" />
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">Starting From</p>
                        <p className="text-xl font-bold text-navy-950 flex items-center gap-0.5"><IndianRupee className="w-3.5 h-3.5" />{exp.price}</p>
                      </div>
                    </div>

                    <Button className="w-full rounded-2xl h-14 bg-navy-950 text-white group/btn border-none font-bold">
                      Book This Experience
                      <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        {!loading && filteredExperiences.length === 0 && (
          <div className="text-center py-40">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Search className="w-12 h-12 text-sand-200" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-navy-950 mb-4">No results found</h3>
            <p className="text-navy-950/40 max-w-sm mx-auto mb-8">
              We couldn't find any experiences matching your search. Try searching for "Architecture" or "History".
            </p>
            <Button onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} variant="outline" className="rounded-2xl border-navy-950">
              Clear All Filters
            </Button>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 mt-32">
        <div className="bg-navy-950 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
           <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px]" />
           <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px]" />
           
           <div className="relative z-10 max-w-3xl mx-auto">
             <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">
               Are you a local <span className="text-gold-400 italic">Hampi Expert?</span>
             </h2>
             <p className="text-xl text-white/60 mb-12 leading-relaxed">
               Join our network of certified storytellers and share the magic of Hampi with travelers from around the world.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Button size="lg" className="rounded-2xl px-12 h-16 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold border-none">
                 Join the Expert Network
               </Button>
               <Button size="lg" variant="outline" className="rounded-2xl px-12 h-16 border-white/20 text-white hover:bg-white/10 font-bold">
                 Learn More
               </Button>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
}
