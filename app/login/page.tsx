'use client'

import { useActionState, useState } from 'react' // <--- Added useState
import { login } from '@/app/actions/auth'
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react' // <--- Added Eye icons
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)
  const [showPassword, setShowPassword] = useState(false) // <--- New State

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* LEFT SIDE: Brand Identity */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2d4a2a] flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 0 L100 0 L100 100 Z" fill="#84c47c" />
           </svg>
        </div>

        <div className="relative z-10">
          <Logo textClassName="text-white text-2xl" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Manage your fleet <br/> with precision.
          </h2>
          <p className="text-green-100 text-lg opacity-80 max-w-md">
            Track installations, manage clients, and streamline your entire field operation in one secure platform.
          </p>
        </div>

        <div className="relative z-10 text-sm text-green-200/60">
          © 2026 CTN CRM. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: The Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-[#e0f2de] rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-[#2d4a2a]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2 text-sm">Please sign in to your account</p>
          </div>

          <form action={action} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 py-3 pl-10 pr-4 text-sm bg-white" 
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} // <--- Dynamic Type
                  required 
                  className="w-full border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 py-3 pl-10 pr-10 text-sm bg-white" 
                  placeholder="••••••••"
                />
                
                {/* TOGGLE BUTTON */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                <span className="font-bold">Error:</span> {state.error}
              </div>
            )}

            <button type="submit" disabled={isPending} className="w-full bg-[#2d4a2a] hover:bg-[#1f351d] text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center gap-2">
              {isPending ? 'Accessing Secure Area...' : 'Sign In to Dashboard'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}