'use client'; 

import { useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Server, 
  Smartphone, CreditCard, Shield, Briefcase, LogOut, Package, User, Lock, 
  TrendingUp, Menu, X, Wrench,
  FileText,
  Car
} from "lucide-react";
import Logo from "./Logo";
import SearchInput from "./SearchInput";
import { logout } from "@/app/actions/auth";
import LoadingLink from "@/components/LoadingLink";

const allMenuItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, requiredModule: null }, 
  { name: "My Profile", href: "/dashboard/profile", icon: User, requiredModule: null },
  { name: "Sales Pipeline", href: "/dashboard/leads", icon: Users, requiredModule: "/dashboard/leads" },
  
  // 👇 NEW SUPPORT MODULE
  { name: "Support Tickets", href: "/dashboard/support", icon: Wrench, requiredModule: null },
  
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, requiredModule: "/dashboard/inventory" },
  { name: "Tech Support", href: "/dashboard/tech", icon: Server, requiredModule: "/dashboard/tech" },
  { name: "Client Onboarding", href: "/dashboard/activation", icon: Smartphone, requiredModule: "/dashboard/activation" },
  { name: "Client Database", href: "/dashboard/clients", icon: Briefcase, requiredModule: "/dashboard/clients" },
  { name: "Fleet & Vehicles", href: "/dashboard/vehicles", icon: Car, module: "Fleet & Vehicles" },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, requiredModule: "/dashboard/payments" },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileText, requiredModule: null },
  { name: "Revenue Analysis", href: "/dashboard/revenue", icon: TrendingUp, adminOnly: true },
  { name: "Team & Roles", href: "/dashboard/users", icon: Shield, adminOnly: true }, 
];
export default function Sidebar({ 
  userRole = 'STAFF', 
  accessibleModules = [] 
}: { 
  userRole?: string, 
  accessibleModules?: string[] 
}) {
  const pathname = usePathname();
  
  // State for Desktop shrinking and Mobile sliding
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* --- MOBILE TOP BAR --- */}
      <div className="md:hidden flex items-center justify-between bg-[#2d4a2a] p-4 text-white shrink-0 shadow-md z-40 relative">
        <Logo textClassName="text-white" showText={true} />
        <button onClick={() => setIsMobileOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
          <Menu size={24} />
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Desktop & Mobile Drawer) --- */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r bg-[#2d4a2a] text-white transition-all duration-300 ease-in-out shadow-2xl shrink-0
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
        ${isMobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}
      `}>
        
        <div className={`flex-1 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isCollapsed ? 'md:px-2' : ''}`}>
          
          {/* Header: Logo & Hamburger */}
          <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'justify-between pl-2'}`}>
            {!isCollapsed && <Logo textClassName="text-white" showText={true} />}
            
            {/* Desktop Hamburger */}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:block p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0">
              <Menu size={20} />
            </button>
            
            {/* Mobile Close 'X' */}
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition shrink-0">
              <X size={24} />
            </button>
          </div>

          {/* Search Bar (Hidden when collapsed) */}
          <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 mb-6'}`}>
            <SearchInput />
          </div>
          
          {/* Navigation Links */}
          <nav className={`flex flex-col gap-1 mt-2 ${isCollapsed ? 'items-center' : ''}`}>
            {allMenuItems.map((item) => {
              const isActive = pathname === item.href;
              
              let hasAccess = false;
              if (userRole === 'ADMIN') hasAccess = true;
              else if (item.adminOnly) hasAccess = false;
              else if (!item.requiredModule) hasAccess = true;
              else hasAccess = accessibleModules.includes(item.requiredModule);

              if (hasAccess) {
                return (
                  <LoadingLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)} // Auto-close on mobile click
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200
                      ${isActive ? "bg-[#84c47c] text-white shadow-md md:translate-x-1" : "text-green-100/70 hover:bg-white/10 hover:text-white"}
                      ${isCollapsed ? 'justify-center w-12 h-12 md:translate-x-0' : 'w-full'}
                    `}
                    title={isCollapsed ? item.name : undefined} // Tooltip when collapsed
                  >
                    <item.icon size={20} className="shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </LoadingLink>
                );
              } else {
                return (
                  <button 
                    key={item.href} 
                    onClick={(e) => { e.preventDefault(); alert(`You do not have permission to access the ${item.name} module.`); }} 
                    className={`flex items-center rounded-lg px-3 py-3 text-sm font-medium text-green-100/30 cursor-not-allowed hover:bg-white/5 transition-colors
                      ${isCollapsed ? 'justify-center w-12 h-12' : 'justify-between w-full text-left'}
                    `}
                    title={isCollapsed ? `${item.name} (Locked)` : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="shrink-0" />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </div>
                    {!isCollapsed && <Lock size={14} className="opacity-50 shrink-0" />}
                  </button>
                );
              }
            })}
          </nav>
        </div>

        {/* Footer: Sign Out */}
        <div className={`p-4 border-t border-white/10 bg-[#253f23] ${isCollapsed ? 'flex justify-center md:p-2' : ''}`}>
          <form action={logout}>
            <button 
              title={isCollapsed ? "Sign Out" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors
                ${isCollapsed ? 'justify-center w-12 h-12' : 'w-full'}
              `}
            >
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}