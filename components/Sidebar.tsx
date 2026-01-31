'use client'; 

import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Server, 
  Smartphone, CreditCard, Shield, Briefcase, LogOut 
} from "lucide-react";
import Logo from "./Logo";
import SearchInput from "./SearchInput";
import { logout } from "@/app/actions/auth";
import LoadingLink from "@/components/LoadingLink";

const menuItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales Pipeline", href: "/dashboard/leads", icon: Users },
  { name: "Tech Support", href: "/dashboard/tech", icon: Server },
  { name: "Client Onboarding", href: "/dashboard/activation", icon: Smartphone },
  { name: "Client Database", href: "/dashboard/clients", icon: Briefcase },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Team & Roles", href: "/dashboard/users", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col justify-between border-r bg-[#2d4a2a] text-white w-64 shadow-2xl">
      <div className="px-4 py-8">
        <div className="mb-8 pl-2">
           <Logo textClassName="text-white" />
        </div>

        <SearchInput />
        
        <nav className="flex flex-col gap-1 mt-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <LoadingLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? "bg-[#84c47c] text-white shadow-md translate-x-1" 
                    : "text-green-100/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </LoadingLink>
            );
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