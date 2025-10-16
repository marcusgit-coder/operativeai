"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Download,
  Eye
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Invoice {
  id: string
  fileName: string
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: number | null
  currency: string | null
  status: string
  confidenceScore: number | null
  needsReview: boolean
  createdAt: Date
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchInvoices()
  }, [filter])

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.append("status", filter.toUpperCase())
      }

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()
      setInvoices(data.invoices || [])
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, needsReview: boolean) => {
    if (needsReview || status === "NEEDS_REVIEW") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Needs Review
        </span>
      )
    }
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      )
    }
    if (status === "PROCESSING") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage and review processed invoices</p>
        </div>
        <Link href="/invoices/upload">
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Upload Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {["all", "completed", "needs_review", "processing"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </Button>
        ))}
      </div>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                No invoices yet
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Upload your first invoice to get started
              </p>
              <Link href="/invoices/upload">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      File Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Vendor
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Due Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Uploaded
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{invoice.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {invoice.vendorName || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {invoice.invoiceNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {invoice.totalAmount
                          ? `${invoice.currency || "HKD"} ${invoice.totalAmount}`
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(invoice.status, invoice.needsReview)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDistanceToNow(new Date(invoice.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
