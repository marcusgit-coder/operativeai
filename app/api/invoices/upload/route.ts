import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { extractInvoiceData } from "@/lib/ai-providers"

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

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
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
        fileUrl: `data:${file.type};base64,${base64.substring(0, 100)}...`,
        fileSize: file.size,
        fileType: file.type,
        status: "PROCESSING",
      },
    })

    console.log(`Processing invoice ${invoice.id}: ${file.name}`)

    // Try AI extraction
    try {
      const extractedData = await extractInvoiceData(base64, file.type)
      
      // Check if AI actually processed it (confidence > 0 means AI worked)
      const aiProcessed = extractedData.confidence > 0 && extractedData.vendorName !== ""
      
      if (aiProcessed) {
        console.log(`AI extracted data with confidence: ${extractedData.confidence}`)
        
        // Update invoice with extracted data
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            vendorName: extractedData.vendorName || null,
            invoiceNumber: extractedData.invoiceNumber || null,
            invoiceDate: extractedData.invoiceDate ? new Date(extractedData.invoiceDate) : null,
            dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : null,
            totalAmount: extractedData.totalAmount || null,
            currency: extractedData.currency || "HKD",
            lineItems: extractedData.lineItems.length > 0 
              ? JSON.stringify(extractedData.lineItems) 
              : null,
            confidenceScore: extractedData.confidence,
            needsReview: extractedData.confidence < 0.9,
            status: extractedData.confidence >= 0.9 ? "COMPLETED" : "NEEDS_REVIEW",
            processedAt: new Date(),
          },
        })

        // Log successful AI processing
        await db.activityLog.create({
          data: {
            organizationId: session.user.organizationId,
            action: "INVOICE_PROCESSED",
            resourceType: "INVOICE",
            resourceId: invoice.id,
            metadata: JSON.stringify({ 
              fileName: file.name,
              aiProvider: "gemini",
              confidence: extractedData.confidence
            }),
          },
        })

        return NextResponse.json({ 
          success: true, 
          invoiceId: invoice.id,
          needsReview: extractedData.confidence < 0.9,
          aiProcessed: true,
          confidence: extractedData.confidence,
          message: extractedData.confidence >= 0.9 
            ? "Invoice processed successfully with AI" 
            : "Invoice processed - please review extracted data"
        })
      } else {
        // AI not configured or failed - manual review
        console.log("AI not available - marking for manual review")
        
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "NEEDS_REVIEW",
            needsReview: true,
            processedAt: new Date(),
          },
        })

        await db.activityLog.create({
          data: {
            organizationId: session.user.organizationId,
            action: "INVOICE_UPLOADED",
            resourceType: "INVOICE",
            resourceId: invoice.id,
            metadata: JSON.stringify({ 
              fileName: file.name,
              note: "Manual review - AI not configured" 
            }),
          },
        })

        return NextResponse.json({ 
          success: true, 
          invoiceId: invoice.id,
          needsReview: true,
          aiProcessed: false,
          message: "Invoice uploaded - AI not configured, manual review required"
        })
      }
    } catch (error) {
      console.error("AI processing error:", error)
      
      // Mark for manual review on AI error
      await db.invoice.update({
        where: { id: invoice.id },
        data: { 
          status: "NEEDS_REVIEW",
          needsReview: true,
          processedAt: new Date(),
        },
      })

      await db.activityLog.create({
        data: {
          organizationId: session.user.organizationId,
          action: "INVOICE_UPLOADED",
          resourceType: "INVOICE",
          resourceId: invoice.id,
          metadata: JSON.stringify({ 
            fileName: file.name,
            note: "AI processing failed - manual review required",
            error: error instanceof Error ? error.message : "Unknown error"
          }),
        },
      })

      return NextResponse.json({ 
        success: true, 
        invoiceId: invoice.id,
        needsReview: true,
        aiProcessed: false,
        message: "Invoice uploaded - AI processing failed, manual review required"
      })
    }
  } catch (error) {
    console.error("Invoice upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload invoice" },
      { status: 500 }
    )
  }
}
