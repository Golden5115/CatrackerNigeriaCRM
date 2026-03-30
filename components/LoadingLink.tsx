'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// 👇 FIX 1: Add onClick and title to the allowed properties
interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string; 
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function LoadingLink({ href, children, className = "", title, onClick }: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname(); 

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. Only spin if navigating to a DIFFERENT page
    if (pathname !== href) {
        setIsLoading(true);
    }
    
    // 👇 FIX 2: If the parent component (like the Sidebar) passed an onClick, trigger it!
    if (onClick) {
        onClick(e);
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      title={title} // 👇 FIX 3: Pass the title down to the HTML
      className={`relative ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
           <Loader2 className="animate-spin text-[#84c47c]" size={16} />
        </div>
      )}
      
      {children}
    </Link>
  )
}