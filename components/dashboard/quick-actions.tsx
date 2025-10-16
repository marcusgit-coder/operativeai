import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Plus, MessageCircle } from "lucide-react"

export default function QuickActions() {
  const actions = [
    {
      title: "Upload Invoice",
      description: "Process a new invoice with AI",
      icon: Upload,
      href: "/invoices/upload",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Add Knowledge",
      description: "Add to support knowledge base",
      icon: Plus,
      href: "/knowledge/new",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "View Support",
      description: "Check customer conversations",
      icon: MessageCircle,
      href: "/support",
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 hover:bg-gray-50"
              >
                <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </div>
              </Button>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
