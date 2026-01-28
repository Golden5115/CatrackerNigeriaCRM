import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, ArrowRight, Activity, Users, MapPin } from 'lucide-react'

export default async function HomePage() {
  // 1. Check if user is already logged in
  const cookie = (await cookies()).get('session')?.value
  const session = await verifySession(cookie)

  // 2. Auto-redirect to Dashboard if session exists
  if (session?.userId) {
    redirect('/dashboard')
  }

  // 3. Otherwise, show the Public Landing Page
  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Navbar */}
      <nav className="border-b border-gray-100 p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl text-[#2d4a2a]">
           <div className="w-8 h-8 bg-[#84c47c] rounded-lg flex items-center justify-center text-white">
             <Activity size={20} />
           </div>
           Cartracker Nigeria
        </div>
        <Link 
          href="/login" 
          className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition text-sm"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-4xl mx-auto space-y-8">
        
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-100">
          <ShieldCheck size={16} /> Internal Staff Portal
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Manage Your Fleet Operations <br/>
          <span className="text-[#84c47c]">With Precision.</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl">
          The central hub for installations, client management, and technical support. 
          Securely access the CRM to manage jobs in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 bg-[#2d4a2a] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#1a2e18] transition shadow-xl shadow-green-900/10"
          >
            Access Dashboard <ArrowRight size={20} />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16 w-full">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 text-blue-600">
               <Users size={20} />
             </div>
             <h3 className="font-bold text-gray-900 mb-2">Client Database</h3>
             <p className="text-sm text-gray-500">Manage customer profiles, vehicle fleets, and communication history.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 text-orange-600">
               <MapPin size={20} />
             </div>
             <h3 className="font-bold text-gray-900 mb-2">Field Installations</h3>
             <p className="text-sm text-gray-500">Track job tickets, installer assignments, and technical configurations.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 text-purple-600">
               <ShieldCheck size={20} />
             </div>
             <h3 className="font-bold text-gray-900 mb-2">Secure Access</h3>
             <p className="text-sm text-gray-500">Role-based access control for Admins, Tech Support, and Installers.</p>
          </div>
        </div>

      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        © {new Date().getFullYear()} Cartracker Nigeria. Authorized Personnel Only.
      </footer>
    </div>
  )
}