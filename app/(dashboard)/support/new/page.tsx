import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import TicketForm from "@/components/support/ticket-form"

export default async function NewTicketPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizationId) {
    redirect("/login")
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/support">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Create New Ticket</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Submit a new support request or question
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm organizationId={session.user.organizationId} />
        </CardContent>
      </Card>
    </div>
  )
}
