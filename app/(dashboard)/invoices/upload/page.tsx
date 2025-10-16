"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

export default function UploadInvoicePage() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setUploading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/invoices/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-gray-100">Upload Invoice</h1>
        <p className="text-gray-600 dark:text-gray-400">Process invoices automatically with AI</p>
      </div>

      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Upload Document</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Drag and drop an invoice or click to browse (PDF, JPG, PNG)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            {uploading ? (
              <p className="text-lg font-medium dark:text-gray-200">Processing...</p>
            ) : isDragActive ? (
              <p className="text-lg font-medium dark:text-gray-200">Drop the file here</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2 dark:text-gray-200">
                  Drag and drop an invoice here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  or click to select a file
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-400">Upload Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start space-x-3 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-400">
                    Invoice Processed Successfully!
                  </p>
                  {result.needsReview && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Low confidence detected - flagged for review
                    </p>
                  )}
                </div>
              </div>

              {result.data && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded border border-green-200 dark:border-green-800 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Vendor:</span>{" "}
                      {result.data.vendorName}
                    </div>
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Invoice #:</span>{" "}
                      {result.data.invoiceNumber}
                    </div>
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Date:</span>{" "}
                      {result.data.invoiceDate}
                    </div>
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Due Date:</span>{" "}
                      {result.data.dueDate}
                    </div>
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Amount:</span>{" "}
                      {result.data.currency} {result.data.totalAmount}
                    </div>
                    <div className="dark:text-gray-200">
                      <span className="font-medium">Confidence:</span>{" "}
                      {(result.data.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-3">
                <Button onClick={() => router.push("/invoices")}>
                  <FileText className="h-4 w-4 mr-2" />
                  View All Invoices
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null)
                    setError("")
                  }}
                >
                  Upload Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
