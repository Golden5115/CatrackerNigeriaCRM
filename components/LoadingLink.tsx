'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function LoadingLink({ href, children, className = "" }: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname(); // <--- Get current URL

  // 🛑 FIX: Automatically stop spinning when the URL changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only spin if we are actually navigating to a DIFFERENT page
    // (Prevents spinning if you click the link you are already on)
    if (pathname !== href) {
        setIsLoading(true);
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={`relative ${className} ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Show Spinner Overlay */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
           <Loader2 className="animate-spin text-[#84c47c]" size={16} />
        </div>
      )}
      
      {/* Keep original children visible but slightly dimmed */}
      {children}
    </Link>
  )
}