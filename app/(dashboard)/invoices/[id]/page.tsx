import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.organizationId) {
    return notFound();
  }

  const invoice = await db.invoice.findFirst({
    where: {
      id: params.id,
      organizationId: session.user.organizationId,
    },
  });

  if (!invoice) {
    return notFound();
  }

  // Parse lineItems if it's a string
  let lineItems = [];
  if (invoice.lineItems) {
    try {
      lineItems = typeof invoice.lineItems === 'string' 
        ? JSON.parse(invoice.lineItems) 
        : invoice.lineItems;
    } catch {
      lineItems = [];
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      NEEDS_REVIEW: "bg-orange-100 text-orange-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    
    const icons = {
      PENDING: Clock,
      PROCESSING: Clock,
      COMPLETED: CheckCircle,
      NEEDS_REVIEW: AlertCircle,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
    };

    const StatusIcon = icons[status as keyof typeof icons] || Clock;
    const style = styles[status as keyof typeof styles] || styles.PENDING;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style}`}>
        <StatusIcon className="w-4 h-4 mr-1" />
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber || "Invoice Details"}
            </h1>
            <p className="text-gray-600 mt-1">{invoice.fileName}</p>
          </div>
          {getStatusBadge(invoice.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Vendor Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vendor Name</p>
                <p className="text-lg font-medium">
                  {invoice.vendorName || "Not extracted"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-lg font-medium">
                  {invoice.invoiceNumber || "Not extracted"}
                </p>
              </div>
            </div>
          </Card>

          {/* Amounts & Dates */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Financial Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoice.currency || "HKD"}{" "}
                  {invoice.totalAmount?.toLocaleString() || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Currency</p>
                <p className="text-lg font-medium">{invoice.currency || "HKD"}</p>
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Important Dates
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="text-lg font-medium">
                  {invoice.invoiceDate
                    ? new Date(invoice.invoiceDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-lg font-medium">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="text-lg font-medium">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          {lineItems.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Line Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                        Description
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Quantity
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Unit Price
                      </th>
                      <th className="text-right py-2 px-4 text-sm font-medium text-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item: any, index: number) => {
                      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                      return (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{item.description}</td>
                          <td className="text-right py-3 px-4">{item.quantity}</td>
                          <td className="text-right py-3 px-4">
                            {invoice.currency || 'HKD'} {item.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right py-3 px-4 font-medium">
                            {invoice.currency || 'HKD'} {itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="py-4 px-4 text-right font-semibold text-gray-700">
                        Subtotal:
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-lg">
                        {invoice.currency || 'HKD'} {lineItems.reduce((sum: number, item: any) => 
                          sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0
                        ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              File Information
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">File Name</p>
                <p className="font-medium break-all">{invoice.fileName}</p>
              </div>
              <div>
                <p className="text-gray-600">File Size</p>
                <p className="font-medium">
                  {(invoice.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
              <div>
                <p className="text-gray-600">File Type</p>
                <p className="font-medium">{invoice.fileType}</p>
              </div>
            </div>
          </Card>

          {/* AI Processing Info */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Processing Details</h3>
            <div className="space-y-3 text-sm">
              {invoice.confidenceScore && (
                <div>
                  <p className="text-gray-600">AI Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${invoice.confidenceScore * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">
                      {(invoice.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-gray-600">Needs Review</p>
                <p className="font-medium">
                  {invoice.needsReview ? "Yes" : "No"}
                </p>
              </div>
              {invoice.processedAt && (
                <div>
                  <p className="text-gray-600">Processed At</p>
                  <p className="font-medium">
                    {new Date(invoice.processedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                Download Invoice
              </Button>
              <Button className="w-full" variant="outline">
                Edit Details
              </Button>
              {invoice.status === "NEEDS_REVIEW" && (
                <>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Approve
                  </Button>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Reject
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Review Notes */}
          {invoice.reviewNotes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Review Notes</h3>
              <p className="text-sm text-gray-700">{invoice.reviewNotes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
