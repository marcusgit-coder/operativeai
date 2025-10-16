import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface InvoiceData {
  vendorName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  totalAmount: number
  currency: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  confidence: number
}

export async function extractInvoiceData(
  imageData: string,
  mimeType: string
): Promise<InvoiceData> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as any,
              data: imageData,
            },
          },
          {
            type: "text",
            text: `Extract all information from this invoice and return it in the following JSON format:
{
  "vendorName": "company name",
  "invoiceNumber": "invoice number",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "currency": "HKD",
  "lineItems": [
    {
      "description": "item description",
      "quantity": 1,
      "unitPrice": 0.00,
      "amount": 0.00
    }
  ],
  "confidence": 0.95
}

Provide a confidence score (0-1) based on how clear the invoice data is. Return ONLY the JSON, no other text.`,
          },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type === "text") {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  }

  throw new Error("Failed to extract invoice data")
}

export async function generateSupportResponse(
  customerMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  knowledgeBase: string[]
): Promise<{ response: string; confidence: number; shouldEscalate: boolean }> {
  const kbContext = knowledgeBase.length > 0
    ? `\n\nKnowledge Base:\n${knowledgeBase.join("\n\n")}`
    : ""

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user",
        content: `${customerMessage}`,
      },
    ],
    system: `You are a helpful customer support assistant for a business. 
${kbContext}

Respond professionally and helpfully. If you're not confident in your answer or if the request involves:
- Refunds or payments
- Legal matters
- Complaints
- Complex technical issues

Include [ESCALATE] at the start of your response.

Provide your response in this format:
Response: [your response here]
Confidence: [0.0-1.0]`,
  })

  const content = message.content[0]
  if (content.type === "text") {
    const shouldEscalate = content.text.includes("[ESCALATE]")
    const responseText = content.text.replace("[ESCALATE]", "").trim()
    
    // Extract confidence (simple heuristic for now)
    const confidenceMatch = responseText.match(/Confidence:\s*(0?\.\d+|1\.0)/)
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8

    const response = responseText.replace(/Confidence:.*$/, "").replace("Response:", "").trim()

    return {
      response,
      confidence,
      shouldEscalate: shouldEscalate || confidence < 0.7,
    }
  }

  throw new Error("Failed to generate response")
}
