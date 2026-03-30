import Image from "next/image";

interface LogoProps {
  className?: string;
  textClassName?: string;
  showText?: boolean; // 👈 Lets you hide the text if your PNG already has it
}

export default function Logo({ className = "", textClassName = "", showText = true }: LogoProps) {
  const companyName = "Cartracker Nigeria"; 

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      
      {/* Pulls directly from your /public/logo.png file */}
      <img 
        src="/logo2.png" 
        alt="Company Logo" 
        className="h-20 w-auto object-contain" 
      /> 

      {/* Renders the text next to the logo (optional) */}
      {showText && (
        <span className={`text-l font-bold tracking-tight ${textClassName}`}>
          {companyName}
        </span>
      )}
    </div>
  );
}