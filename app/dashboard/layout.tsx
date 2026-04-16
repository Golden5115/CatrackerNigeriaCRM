import Sidebar from "@/components/Sidebar"
import { verifySession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()
  const userId = typeof session?.userId === 'string' ? session.userId : null;
  
  const user = userId 
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null

  return (
    // 🟢 FIXED: Added print:h-auto print:overflow-visible print:block to break out of the screen height
    <div className="flex h-screen overflow-hidden bg-gray-50 flex-col md:flex-row print:h-auto print:overflow-visible print:block">
      
      <Sidebar 
        userRole={user?.role} 
        accessibleModules={user?.accessibleModules || []} 
      />
      
      {/* 🟢 FIXED: Added print:overflow-visible print:h-auto print:block so the content expands across multiple pages naturally */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 print:overflow-visible print:h-auto print:block print:p-0">
        {children}
      </main>
    </div>
  )
}