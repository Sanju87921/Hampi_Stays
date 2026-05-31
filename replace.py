import sys

file_path = "c:/Users/sanju/Desktop/Hampi-Stays/frontend/src/pages/admin/AdminDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

replacement = """ <div className="min-h-screen bg-sand-50 pt-20 pb-12">
 <div className="container mx-auto px-4 max-w-7xl">
 <header className="mb-4">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex flex-col">
 <div className="flex items-center gap-2 text-gold-600 mb-1">
 <ShieldCheck className="w-4 h-4" />
 <span className="text-[10px] font-bold uppercase tracking-widest">Administrator Portal</span>
 </div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-serif font-bold text-navy-950 leading-none">Command Center</h1>
 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
 <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live Status Syncing</span>
 </div>
 </div>
 </div>
 <button 
 onClick={fetchInitialData}
 className="text-[10px] font-bold text-navy-950 hover:text-gold-600 uppercase tracking-widest border-b border-transparent hover:border-gold-600 transition-all self-start md:self-auto"
 >
 Sync Now
 </button>
 </div>
 </header>

 {/* Sub Navigation */}
 <nav className="flex items-center bg-white p-1 rounded-xl border border-sand-200 shadow-sm mb-4 overflow-x-auto hide-scrollbar w-full">
 {[
 { id: "overview", label: "Overview", icon: LayoutDashboard },
 { id: "properties", label: "Properties", icon: Building2 },
 { id: "promotions", label: "Promotions", icon: Tag },
 { id: "content", label: "Blog Content", icon: FileText },
 { id: "guides", label: "Guides", icon: Award },
 { id: "users", label: "Users", icon: Users },
 { id: "bookings", label: "Bookings", icon: CalendarDays },
 { id: "commissions", label: "Commissions", icon: TrendingUp },
 { id: "otp-logs", label: "OTP Logs", icon: KeyRound },
 { id: "audit-logs", label: "Audit Logs", icon: History },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as AdminTab)}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${
 activeTab === tab.id 
 ? "bg-navy-950 text-white shadow-md" 
 : "text-navy-950 hover:bg-sand-50"
 }`}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </nav>

 {/* KPI Operations Bar */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <Users className="w-4 h-4 text-gold-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Users</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{stats?.userCount || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <Building2 className="w-4 h-4 text-emerald-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Active Resorts</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{activeResorts.length || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <AlertCircle className="w-4 h-4 text-amber-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Pending Resorts</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{pendingResorts.length || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <CalendarDays className="w-4 h-4 text-blue-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Bookings</span>
 </div>
 <p className="text-xl font-bold text-navy-950">{stats?.bookingCount || 0}</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-200 shadow-sm flex flex-col justify-center">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="w-4 h-4 text-emerald-600" />
 <span className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Total Revenue</span>
 </div>
 <p className="text-xl font-bold text-navy-950">₹{stats?.platformEarnings?.toLocaleString() || 0}</p>
 </div>
 </div>\n"""

# Lines 1910 to 1959 are indexes 1909 to 1959
new_lines = lines[:1909] + [replacement] + lines[1959:]

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Replaced successfully")
