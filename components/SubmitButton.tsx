'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  children: React.ReactNode; // The text like "Create Lead"
  className?: string;        // Your custom styles
  loadingText?: string;      // What to say when loading
}

export default function SubmitButton({ 
  children, 
  className = "", 
  loadingText = "Processing..." 
}: SubmitButtonProps) {
  // This hook automatically knows if the parent form is busy!
  const { pending } = useFormStatus()
  
  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={`disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 ${className}`}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}