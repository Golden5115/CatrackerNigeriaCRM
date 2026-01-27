import { Radio } from "lucide-react"; // Or import your preferred icon

export default function Logo({ className = "", textClassName = "" }: { className?: string, textClassName?: string }) {
  // --- CONFIGURATION ---
  const companyName = "Cartracker Nigeria"; // <--- CHANGE THIS TO YOUR COMPANY NAME
  // ---------------------

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      
      {/* 🔹 OPTION 1: Icon Logo (Default) */}
      <div className="bg-brand-600 p-2 rounded-lg text-white">
        <Radio size={24} strokeWidth={2.5} />
      </div>

      {/* 🔹 OPTION 2: Image Logo (Uncomment this when you have a logo.png in /public folder) */}
      {/* <img src="/logo.png" alt="Logo" className="h-10 w-auto" /> 
      */}

      {/* Company Name Text */}
      <span className={`text-xl font-bold text-gray-900 tracking-tight ${textClassName}`}>
        {companyName}
      </span>
    </div>
  );
}