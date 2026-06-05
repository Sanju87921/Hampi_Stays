const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/admin/AdminDashboard.tsx', 'utf8');

// Replace cancellation rate
code = code.replace(
  /<p className="text-3xl font-serif font-bold text-navy-950 italic">{\(stats\?\.cancellationRate \|\| 4\.2\)}%<\/p>\s*<div className="mt-4 w-full bg-sand-100 h-1\.5 rounded-full overflow-hidden">\s*<div className="bg-navy-950 h-full w-\[4\.2%\]" \/>\s*<\/div>/,
  `<p className="text-3xl font-serif font-bold text-navy-950 italic">{(stats?.cancellationRate !== undefined ? stats.cancellationRate : 4.2)}%</p>
 <div className="mt-4 w-full bg-sand-100 h-1.5 rounded-full overflow-hidden">
 <div className="bg-navy-950 h-full transition-all duration-1000" style={{ width: \`\${(stats?.cancellationRate !== undefined ? stats.cancellationRate : 4.2)}%\` }} />
 </div>`
);

// Replace revenue growth chart
code = code.replace(
  /{\[35, 42, 38, 55, 72, 85, 95\]\.map\(\(val, i\) => \(\s*<div key={i} className="flex-grow group relative flex flex-col justify-end h-full">\s*<motion\.div \s*initial={{ height: 0 }}\s*animate={{ height: \`\${val}%\` }}\s*transition={{ delay: i \* 0\.1, duration: 1 }}\s*className="w-full bg-navy-950 rounded-t-xl group-hover:bg-gold-500 transition-colors cursor-pointer"\s*\/>\s*<p className="mt-4 text-\[8px\] font-bold text-navy-950 text-center uppercase">M-{i\+1}<\/p>\s*<\/div>\s*\)\)}/,
  `{(stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? stats.monthlyRevenue : [
  { revenue: 35000, label: "M-1" }, { revenue: 42000, label: "M-2" }, { revenue: 38000, label: "M-3" },
  { revenue: 55000, label: "M-4" }, { revenue: 72000, label: "M-5" }, { revenue: 85000, label: "M-6" }, { revenue: 95000, label: "M-7" }
]).map((item: any, i: number, arr: any[]) => {
  const maxRevenue = Math.max(...arr.map((a: any) => a.revenue), 100);
  const val = (item.revenue / maxRevenue) * 100;
  return (
     <div key={i} className="flex-grow group relative flex flex-col justify-end h-full">
        <motion.div 
           initial={{ height: 0 }}
           animate={{ height: \\\`\${val}%\\\` }}
           transition={{ delay: i * 0.1, duration: 1 }}
           className="w-full bg-navy-950 rounded-t-xl group-hover:bg-gold-500 transition-colors cursor-pointer"
        />
        <p className="mt-4 text-[8px] font-bold text-navy-950 text-center uppercase">{item.label}</p>
     </div>
  );
})}`
);

// Replace recent activity
code = code.replace(
  /{\[1, 2, 3\]\.map\(\(_, i\) => \(\s*<div key={i} className="flex items-center gap-4 p-4 hover:bg-sand-50 :bg-sand-100 rounded-2xl transition-colors">\s*<div className="w-10 h-10 bg-sand-100 rounded-full flex items-center justify-center">\s*<CheckCircle className="w-5 h-5 text-emerald-500" \/>\s*<\/div>\s*<div className="flex-grow">\s*<p className="text-sm font-bold text-navy-950 ">New Booking Confirmed<\/p>\s*<p className="text-xs text-navy-950 ">Traveler booked Heritage Resort Hampi for 3 nights\.<\/p>\s*<\/div>\s*<p className="text-\[10px\] font-bold text-navy-950 uppercase">2h ago<\/p>\s*<\/div>\s*\)\)}/,
  `{(stats?.recentActivity?.length > 0 ? stats.recentActivity : [
  { id: '1', title: 'System Active', description: 'Waiting for new bookings to appear.', timeAgo: 'Just now' }
]).map((activity: any, i: number) => (
<div key={activity.id || i} className="flex items-center gap-4 p-4 hover:bg-sand-50 :bg-sand-100 rounded-2xl transition-colors">
<div className="w-10 h-10 bg-sand-100 rounded-full flex items-center justify-center">
<CheckCircle className="w-5 h-5 text-emerald-500" />
</div>
<div className="flex-grow">
<p className="text-sm font-bold text-navy-950 ">{activity.title}</p>
<p className="text-xs text-navy-950 ">{activity.description}</p>
</div>
<p className="text-[10px] font-bold text-navy-950 uppercase">{activity.timeAgo}</p>
</div>
))}`
);

fs.writeFileSync('frontend/src/pages/admin/AdminDashboard.tsx', code);
console.log('Successfully replaced values');
