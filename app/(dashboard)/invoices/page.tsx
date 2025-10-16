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

  const exportToCSV = () => {
    if (invoices.length === 0) return;

    // Create CSV headers
    const headers = [
      "Invoice Number",
      "Vendor",
      "Amount",
      "Currency",
      "Invoice Date",
      "Due Date",
      "Status",
      "File Name",
      "Created At"
    ];

    // Create CSV rows
    const rows = invoices.map(inv => [
      inv.invoiceNumber || "",
      inv.vendorName || "",
      inv.totalAmount || "",
      inv.currency || "HKD",
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "",
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
      inv.status,
      inv.fileName,
      new Date(inv.createdAt).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getStatusBadge = (status: string, needsReview: boolean) => {
    if (needsReview || status === "NEEDS_REVIEW") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Needs Review
        </span>
      )
    }
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      )
    }
    if (status === "PROCESSING") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and review processed invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" disabled={invoices.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/invoices/upload">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Upload Invoice
            </Button>
          </Link>
        </div>
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
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      File Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Vendor
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Due Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Uploaded
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                          <span className="text-sm dark:text-gray-300">{invoice.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm dark:text-gray-300">
                        {invoice.vendorName || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm dark:text-gray-300">
                        {invoice.invoiceNumber || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium dark:text-gray-300">
                        {invoice.totalAmount
                          ? `${invoice.currency || "HKD"} ${invoice.totalAmount}`
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm dark:text-gray-300">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(invoice.status, invoice.needsReview)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(invoice.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="Download">
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
