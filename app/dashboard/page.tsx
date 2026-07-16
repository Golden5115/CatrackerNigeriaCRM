import { prisma } from "@/lib/prisma"
import { verifySession } from "@/lib/session"
import { 
  Car, Wrench, Cpu, AlertCircle, Smartphone, 
  TrendingUp, Calendar, Package, Hash, User,
  Activity, CheckCircle2, DollarSign, MapPin
} from "lucide-react"
import Link from "next/link"
import OverviewFiltersClient from "@/components/OverviewFiltersClient"
import OfflineAlertCard from "@/components/OfflineAlertCard"

export const dynamic = 'force-dynamic';

export default async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await verifySession();
  const params = await searchParams;
  
  const now = new Date();
  
  // 1. Core Date Logic
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); 
  startOfThisWeek.setHours(0,0,0,0);
  
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setMilliseconds(-1);

  // 2. Filter Logic (Defaults to Current Month)
  const filterMonth = params?.month ? parseInt(params.month as string) : now.getMonth() + 1;
  const filterYear = params?.year ? parseInt(params.year as string) : now.getFullYear();
  const filterLeadSource = params?.leadSource as string | undefined;
  const filterInstaller = params?.installer as string | undefined;

  const filterStartDate = new Date(filterYear, filterMonth - 1, 1);
  const filterEndDate = new Date(filterYear, filterMonth, 0, 23, 59, 59, 999);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const displayFilterName = `${monthNames[filterMonth - 1]} ${filterYear}`;

  const completedStatuses: any[] = ['PENDING_QC', 'CONFIGURED', 'ACTIVE'];

  // 🟢 INTEGRATION 1: Added Support Model count and distinct Lead Sources query
  const [
    installsThisMonth, installsThisWeek, installsLastWeek,
    totalLeads, convertedLeads, pendingSupport,
    completedSupport, pendingPayments, distinctClients, distinctInstallersRaw,
    expiringSoon
  ] = await Promise.all([
    prisma.job.count({ where: { isArchived: false, installDate: { gte: startOfThisMonth }, status: { in: completedStatuses } } }),
    prisma.job.count({ where: { isArchived: false, installDate: { gte: startOfThisWeek }, status: { in: completedStatuses } } }),
    prisma.job.count({ where: { isArchived: false, installDate: { gte: startOfLastWeek, lte: endOfLastWeek }, status: { in: completedStatuses } } }),
    prisma.job.count({ where: { isArchived: false, jobType: 'NEW_INSTALL' } }),
    prisma.job.count({ where: { isArchived: false, jobType: 'NEW_INSTALL', onboarded: true } }), 
    prisma.support.count({ where: { isArchived: false, status: 'PENDING' } }),
    prisma.job.count({ where: { isArchived: false, jobType: { not: 'NEW_INSTALL' }, status: { in: ['CONFIGURED', 'ACTIVE'] } } }),
    prisma.job.count({ where: { isArchived: false, status: 'ACTIVE', paymentStatus: { not: 'PAID' } } }),
    prisma.client.findMany({ where: { isArchived: false }, select: { leadSource: true }, distinct: ["leadSource"] }),
    prisma.job.findMany({ where: { isArchived: false, installerName: { not: null } }, select: { installerName: true }, distinct: ["installerName"] }),
    prisma.job.count({ 
      where: { 
        isArchived: false, 
        status: 'ACTIVE', 
        expirationDate: { 
          gte: new Date(), 
          lte: new Date(new Date().setDate(new Date().getDate() + 14)) 
        } 
      } 
    })
  ]);

  // Map and clean up lead sources and installers for the filter dropdowns
  const dbLeadSources = distinctClients
    .map((c) => c.leadSource)
    .filter((source): source is string => Boolean(source));
    
  // Ensure all standard options are always available in the filter
  const standardLeadSources = ["Walk-in", "Instagram", "Facebook", "TikTok", "WhatsApp", "Referral", "Website", "B2B", "Mr michael", "Other"];
  const leadSources = Array.from(new Set([...standardLeadSources, ...dbLeadSources]));
    
  const installerNames = distinctInstallersRaw
    .map((job) => job.installerName)
    .filter((name): name is string => Boolean(name));

  // Inventory and Queues batch
  const [unusedSims, unusedDevices, inOnboarding, inTech] = await Promise.all([
    prisma.simCard.count({ where: { status: 'IN_STOCK' } }),
    prisma.device.count({ where: { status: 'IN_STOCK' } }),
    prisma.job.count({ where: { isArchived: false, status: 'CONFIGURED', onboarded: false } }),
    prisma.job.count({ where: { isArchived: false, status: 'PENDING_QC' } }),
  ]);

  // 🟢 INTEGRATION 2: Apply the Lead Source and Installer filters to the query
  const installWhere: any = {
    isArchived: false,
    installDate: { gte: filterStartDate, lte: filterEndDate },
    status: { in: completedStatuses }
  };

  if (filterLeadSource && filterLeadSource !== "ALL") {
    installWhere.vehicle = {
      client: { leadSource: filterLeadSource }
    };
  }

  if (filterInstaller && filterInstaller !== "ALL") {
    installWhere.installerName = filterInstaller;
  }

  // Installer GroupBy Stats
  const installerStats = await prisma.job.groupBy({
    by: ['installerName'],
    where: {
      isArchived: false,
      installDate: { gte: filterStartDate, lte: filterEndDate },
      status: { in: completedStatuses },
      installerName: { not: null },
      AND: [
        { installerName: { not: "" } }
      ]
    },
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        installerName: 'desc'
      }
    }
  });

  const filteredInstallsList = await prisma.job.findMany({
    where: installWhere,
    include: {
      vehicle: { include: { client: true } },
      device: true
    },
    orderBy: { installDate: 'desc' }
  });

  // Top Locations Logic
  const locationStats: Record<string, number> = {};
  filteredInstallsList.forEach(job => {
    const stateRaw = job.vehicle?.client?.state;
    const loc = stateRaw && stateRaw.trim() !== '' ? stateRaw.trim() : "Unknown / Not Set";
    locationStats[loc] = (locationStats[loc] || 0) + 1;
  });
  
  const sortedLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return (
    <div className="space-y-8 pb-12 font-sans max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Operations Center</h2>
           <p className="text-sm text-gray-500 font-medium mt-1">Live statistics across leads, fleet, support, and inventory.</p>
        </div>
      </div>

      {/* ============================== */}
      {/* ROW 1: PREMIUM KPI CARDS       */}
      {/* ============================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: This Month */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 shadow-lg shadow-blue-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Installs This Month</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-5xl font-black tracking-tighter">{installsThisMonth}</p>
                 <p className="text-sm font-bold text-blue-200 mb-1.5">Vehicles</p>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Activity size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Card 2: This Week */}
        <div className="bg-gradient-to-br from-[#84c47c] to-[#5a9a52] rounded-3xl p-6 shadow-lg shadow-green-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="absolute bottom-0 right-0 -mb-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-green-100 uppercase tracking-widest mb-1">Installs This Week</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-5xl font-black tracking-tighter">{installsThisWeek}</p>
                 <p className="text-sm font-bold text-green-100 mb-1.5">Vehicles</p>
              </div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
        </div>

        {/* Card 3: Last Week */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 shadow-lg shadow-gray-900/20 text-white relative overflow-hidden group transition hover:-translate-y-1">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Installs Last Week</p>
              <div className="flex items-end gap-2 mt-2">
                 <p className="text-5xl font-black tracking-tighter text-gray-100">{installsLastWeek}</p>
                 <p className="text-sm font-bold text-gray-500 mb-1.5">Vehicles</p>
              </div>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <Calendar size={24} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================== */}
      {/* ROW 2: PIPELINES & CONVERSION  */}
      {/* ============================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEADS & CHART (Takes up 2 columns on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex-1 w-full">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Lead Conversion Pipeline
            </h3>
            <div className="flex items-center justify-start gap-8">
              <div>
                <p className="text-3xl font-black text-gray-800">{totalLeads}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Total Leads</p>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div>
                <p className="text-3xl font-black text-[#84c47c]">{convertedLeads}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Converted</p>
              </div>
            </div>
          </div>
          
          {/* Stunning Donut Chart */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-sm" style={{ background: `conic-gradient(#3b82f6 ${conversionRate}%, #f3f4f6 ${conversionRate}%)` }}>
               <div className="absolute w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                 <span className="text-xl font-black text-gray-800">{conversionRate}%</span>
               </div>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 tracking-widest">Success Rate</p>
          </div>
        </div>

        {/* INVENTORY */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Shelf Inventory
            </h3>
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm"><Cpu size={16} className="text-indigo-500"/></div>
                  <span className="text-sm font-bold text-gray-600">Devices</span>
                </div>
                <span className="text-xl font-black text-gray-900">{unusedDevices}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm"><Smartphone size={16} className="text-indigo-500"/></div>
                  <span className="text-sm font-bold text-gray-600">SIM Cards</span>
                </div>
                <span className="text-xl font-black text-gray-900">{unusedSims}</span>
              </div>
            </div>
        </div>

      </div>

      {/* ============================== */}
      {/* ROW 3: BOTTLENECKS & ALERTS    */}
      {/* ============================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
        
        {/* EXPIRING SOON */}
        <Link href="/dashboard/psf?tab=expiring" className="bg-white rounded-3xl p-5 shadow-sm border border-orange-100 flex items-center gap-4 transition hover:shadow-md hover:border-orange-200">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><Calendar size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Expiring ≤ 14d</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-2xl font-black text-orange-600">{expiringSoon}</p>
              {expiringSoon > 0 && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">CALL</span>}
            </div>
          </div>
        </Link>

        {/* SUPPORT PENDING (Fixed to show actual new support count) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><Wrench size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Support</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{pendingSupport}</p>
          </div>
        </div>

        {/* IN TECH QUEUE */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="bg-yellow-50 p-4 rounded-2xl text-yellow-600"><AlertCircle size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">In Tech Queue</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{inTech}</p>
          </div>
        </div>

        {/* ONBOARDING QUEUE */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="bg-purple-50 p-4 rounded-2xl text-purple-500"><Smartphone size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Awaiting Login</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{inOnboarding}</p>
          </div>
        </div>

        {/* UNPAID JOBS */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 transition hover:shadow-md">
          <div className="bg-red-50 p-4 rounded-2xl text-red-500"><DollarSign size={20} /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unpaid Jobs</p>
            <p className="text-2xl font-black text-gray-800 mt-0.5">{pendingPayments}</p>
          </div>
        </div>

        {/* OFFLINE VEHICLES */}
        <OfflineAlertCard />

      </div>

      {/* ============================== */}
      {/* ROW 4: PERFORMANCE & LOCATIONS */}
      {/* ============================== */}
      <div className="flex flex-col gap-5 mt-8">
        
        {/* Top Installers */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <details className="group marker:content-['']">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Top Installers ({displayFilterName})
              </h3>
              <div className="text-gray-400 group-open:rotate-180 transition-transform duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </summary>
            
            <div className="mt-6 pt-6 border-t border-gray-50">
              {installerStats.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium text-center py-4">No completed installations found for this period.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {installerStats.map((stat, index) => (
                    <div key={stat.installerName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-600">
                          {index + 1}
                        </div>
                        <span className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{stat.installerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200">
                        <span className="text-base font-black text-gray-900">{stat._count._all}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <details className="group marker:content-['']">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Top Locations ({displayFilterName})
              </h3>
              <div className="text-gray-400 group-open:rotate-180 transition-transform duration-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </summary>
            
            <div className="mt-6 pt-6 border-t border-gray-50">
              {sortedLocations.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium text-center py-4">No completed installations found for this period.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {sortedLocations.map(([location, count], index) => (
                    <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 transition hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                          <MapPin size={14} />
                        </div>
                        <span className={`font-bold text-sm truncate max-w-[120px] ${location === "Unknown / Not Set" ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                          {location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200">
                        <span className="text-base font-black text-gray-900">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

      </div>

      {/* ============================== */}
      {/* FILTERABLE INSTALLATIONS LIST  */}
      {/* ============================== */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
         <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
            <div>
               <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                 <CheckCircle2 size={20} className="text-[#84c47c]"/> {displayFilterName} Installations
               </h3>
               <p className="text-xs text-gray-500 mt-1 font-medium">Total confirmed installs for this period: <span className="font-bold text-gray-800 bg-gray-200 px-2 py-0.5 rounded-full ml-1">{filteredInstallsList.length}</span></p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
               <OverviewFiltersClient 
                 installerNames={installerNames}
                 leadSources={leadSources}
                 defaultMonth={filterMonth.toString()}
                 defaultYear={filterYear.toString()}
                 defaultInstaller={filterInstaller || "ALL"}
                 defaultLeadSource={filterLeadSource || "ALL"}
               />
            </div>
         </div>
         
         <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
           <table className="min-w-full divide-y divide-gray-100">
             <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
               <tr>
                 <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Install Date</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Client</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Installer</th>
                 <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">IMEI / Tracker</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {filteredInstallsList.map((job) => (
                 <tr key={job.id} className="hover:bg-gray-50/80 transition group">
                   <td className="px-6 py-4">
                     <span className="text-[11px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                       {job.installDate ? new Date(job.installDate).toLocaleDateString('en-GB') : 'Unknown'}
                     </span>
                   </td>
                   <td className="px-6 py-4">
                     <div className="font-bold text-sm text-gray-900 flex items-center gap-2"><Car size={14} className="text-gray-400 group-hover:text-blue-500 transition" /> {job.vehicle.name}</div>
                     <div className="text-[11px] text-gray-400 font-mono mt-1 font-medium flex items-center gap-1"><Hash size={10}/> {job.vehicle.plateNumber || "NO PLATE"}</div>
                   </td>
                   <td className="px-6 py-4">
                     <Link href={`/dashboard/clients/${job.vehicle.clientId}`} className="font-bold text-xs text-blue-600 hover:text-blue-800 transition flex items-center gap-1.5 bg-blue-50 w-fit px-3 py-1.5 rounded-lg border border-blue-100 mb-1">
                       <User size={12}/> {job.vehicle.client.fullName}
                     </Link>
                     {/* 🟢 INTEGRATION 4: Added Lead Source below the client name so you can see your filter working */}
                     {job.vehicle.client.leadSource && (
                       <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                         Src: {job.vehicle.client.leadSource}
                       </div>
                     )}
                   </td>
                   <td className="px-6 py-4">
                     <div className="font-bold text-xs text-gray-700 flex items-center gap-1.5 bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-200">
                       <Wrench size={12} className="text-gray-400" />
                       {job.installerName || 'Unassigned'}
                     </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <div className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 inline-block">
                       {job.device?.imei || 'Unknown'}
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           {filteredInstallsList.length === 0 && (
             <div className="p-16 text-center flex flex-col items-center justify-center bg-gray-50/30">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                   <AlertCircle size={32} className="text-gray-400"/>
                </div>
                <p className="text-gray-500 font-medium text-sm">No installations found for {displayFilterName}.</p>
             </div>
           )}
         </div>
      </div>

    </div>
  )
}