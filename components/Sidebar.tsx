'use client'; 

import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Server, 
  Smartphone, CreditCard, Shield, Briefcase, LogOut, Package, User, Lock, 
  TrendingUp
} from "lucide-react";
import Logo from "./Logo";
import SearchInput from "./SearchInput";
import { logout } from "@/app/actions/auth";
import LoadingLink from "@/components/LoadingLink";

const allMenuItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, requiredModule: null }, 
  { name: "My Profile", href: "/dashboard/profile", icon: User, requiredModule: null },
  { name: "Sales Pipeline", href: "/dashboard/leads", icon: Users, requiredModule: "/dashboard/leads" },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, requiredModule: "/dashboard/inventory" },
  { name: "Tech Support", href: "/dashboard/tech", icon: Server, requiredModule: "/dashboard/tech" },
  { name: "Client Onboarding", href: "/dashboard/activation", icon: Smartphone, requiredModule: "/dashboard/activation" },
  { name: "Client Database", href: "/dashboard/clients", icon: Briefcase, requiredModule: "/dashboard/clients" },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard, requiredModule: "/dashboard/payments" },
  
  // 👇 NEW REVENUE MODULE LINK (Admin Only for security)
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

return (
    <div className="flex h-screen flex-col justify-between border-r bg-[#2d4a2a] text-white w-64 shadow-2xl shrink-0">
      <div className="px-4 py-8">
        <div className="mb-8 pl-2">
           <Logo textClassName="text-white" />
        </div>

        <SearchInput />
        
        <nav className="flex flex-col gap-1 mt-6">
          {allMenuItems.map((item) => {
            const isActive = pathname === item.href;
            
            // 1. Determine Access
            let hasAccess = false;
            if (userRole === 'ADMIN') hasAccess = true;
            else if (item.adminOnly) hasAccess = false;
            else if (!item.requiredModule) hasAccess = true;
            else hasAccess = accessibleModules.includes(item.requiredModule);

            // 2. Render Active Link
            if (hasAccess) {
              return (
                <LoadingLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200
                    ${isActive ? "bg-[#84c47c] text-white shadow-md translate-x-1" : "text-green-100/70 hover:bg-white/10 hover:text-white"}
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </LoadingLink>
              );
            } 
            // 3. Render LOCKED Button
            else {
              return (
                <button 
                  key={item.href} 
                  onClick={(e) => { e.preventDefault(); alert(`You do not have permission to access the ${item.name} module. Please contact an Administrator.`); }} 
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-green-100/30 cursor-not-allowed hover:bg-white/5 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
                  <Lock size={14} className="opacity-50" />
                </button>
              );
            }
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#253f23]">
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors">
            <LogOut size={20} />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}