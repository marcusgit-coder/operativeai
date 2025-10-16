import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { extractInvoiceData } from "@/lib/claude"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Create invoice record
    const invoice = await db.invoice.create({
      data: {
        organizationId: session.user.organizationId,
        fileName: file.name,
        fileUrl: `data:${file.type};base64,${base64.substring(0, 100)}...`, // Truncated for storage
        fileSize: file.size,
        fileType: file.type,
        status: "PROCESSING",
      },
    })

    // Extract data using Claude (async processing)
    // Check if API key is configured
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY

    try {
      if (hasApiKey) {
        // Use AI to extract data
        const extractedData = await extractInvoiceData(base64, file.type)
        
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            vendorName: extractedData.vendorName,
            invoiceNumber: extractedData.invoiceNumber,
            invoiceDate: new Date(extractedData.invoiceDate),
            dueDate: new Date(extractedData.dueDate),
            totalAmount: extractedData.totalAmount,
            currency: extractedData.currency,
            lineItems: extractedData.lineItems,
            confidenceScore: extractedData.confidence,
            needsReview: extractedData.confidence < 0.9,
            status: extractedData.confidence < 0.9 ? "NEEDS_REVIEW" : "COMPLETED",
            processedAt: new Date(),
          },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            organizationId: session.user.organizationId,
            action: "INVOICE_PROCESSED",
            resourceType: "INVOICE",
            resourceId: invoice.id,
            metadata: { fileName: file.name },
          },
        })

        return NextResponse.json({ 
          success: true, 
          invoiceId: invoice.id,
          needsReview: extractedData.confidence < 0.9,
          data: extractedData
        })
      } else {
        // No API key - mark for manual review
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "NEEDS_REVIEW",
            needsReview: true,
            processedAt: new Date(),
          },
        })

        // Log activity
        await db.activityLog.create({
          data: {
            organizationId: session.user.organizationId,
            action: "INVOICE_UPLOADED",
            resourceType: "INVOICE",
            resourceId: invoice.id,
            metadata: { fileName: file.name, note: "Manual review - AI not configured" },
          },
        })

        return NextResponse.json({ 
          success: true, 
          invoiceId: invoice.id,
          needsReview: true,
          message: "Invoice uploaded successfully. AI extraction not configured - please review manually."
        })
      }
    } catch (error) {
      // Update invoice status to error
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: "NEEDS_REVIEW" },
      })
      
      throw error
    }
  } catch (error) {
    console.error("Invoice upload error:", error)
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 }
    )
  }
}
