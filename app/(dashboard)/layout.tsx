import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import ClientSessionProvider from "@/components/client-session-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <ClientSessionProvider session={session}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={session.user} />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
            {children}
          </main>
        </div>
      </div>
    </ClientSessionProvider>
  )
}
