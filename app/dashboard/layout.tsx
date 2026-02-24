import Sidebar from "@/components/Sidebar"
import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Get the current logged-in session
  const session = await verifySession()
  
  // 👇 FIX: Explicitly extract the userId as a string
  const userId = typeof session?.userId === 'string' ? session.userId : null;
  
  // 2. Fetch their exact user profile and permissions from the DB using the safe string
  const user = userId 
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* 3. Hand the secure permissions directly to the Sidebar */}
      <Sidebar 
        userRole={user?.role} 
        accessibleModules={user?.accessibleModules || []} 
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}