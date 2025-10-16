import { GoogleGenerativeAI } from "@google/generative-ai";

export interface InvoiceData {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  confidence: number;
}

// ==========================================
// Google Gemini Integration (PRIMARY - FREE)
// ==========================================

const genAI = process.env.GOOGLE_AI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export async function extractInvoiceDataWithGemini(
  imageData: string,
  mimeType: string
): Promise<InvoiceData> {
  if (!genAI) {
    throw new Error("Google AI API key not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert invoice data extraction system. Analyze this invoice image and extract ALL information accurately.

Return ONLY a JSON object (no markdown, no explanations) in this EXACT format:
{
  "vendorName": "company name from invoice header",
  "invoiceNumber": "invoice/reference number",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "currency": "HKD",
  "lineItems": [
    {
      "description": "item or service description",
      "quantity": 1,
      "unitPrice": 0.00,
      "amount": 0.00
    }
  ],
  "confidence": 0.95
}

IMPORTANT:
- Extract ALL line items from the invoice
- Use Hong Kong Dollars (HKD) as default currency unless stated otherwise
- Set confidence 0.0-1.0 based on image clarity
- If you can't read a field clearly, use empty string "" for text or 0 for numbers
- Confidence should be 0.9+ only if you're very sure about the data
- Return ONLY valid JSON, nothing else`;

  try {
    const imageParts = [
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini raw response:", text);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // Validate and normalize data
    return {
      vendorName: extractedData.vendorName || "",
      invoiceNumber: extractedData.invoiceNumber || "",
      invoiceDate: extractedData.invoiceDate || "",
      dueDate: extractedData.dueDate || "",
      totalAmount: parseFloat(extractedData.totalAmount) || 0,
      currency: extractedData.currency || "HKD",
      lineItems: Array.isArray(extractedData.lineItems)
        ? extractedData.lineItems.map((item: any) => ({
            description: item.description || "",
            quantity: parseFloat(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            amount: parseFloat(item.amount) || 0,
          }))
        : [],
      confidence: parseFloat(extractedData.confidence) || 0.5,
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    throw error;
  }
}

// ==========================================
// OpenAI GPT-4 Vision Integration (BACKUP)
// ==========================================

export async function extractInvoiceDataWithOpenAI(
  imageData: string,
  mimeType: string
): Promise<InvoiceData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
              },
            },
            {
              type: "text",
              text: `Extract all information from this invoice and return ONLY a JSON object in this format:
{
  "vendorName": "company name",
  "invoiceNumber": "invoice number",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "totalAmount": 0.00,
  "currency": "HKD",
  "lineItems": [{"description": "item", "quantity": 1, "unitPrice": 0.00, "amount": 0.00}],
  "confidence": 0.95
}`,
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("Failed to extract invoice data with OpenAI");
}

// ==========================================
// MAIN FUNCTION - Auto-selects best provider
// ==========================================

export async function extractInvoiceData(
  imageData: string,
  mimeType: string
): Promise<InvoiceData> {
  console.log("Starting invoice extraction...");

  // Try Google Gemini first (FREE and works in HK)
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      console.log("Using Google Gemini for extraction...");
      const result = await extractInvoiceDataWithGemini(imageData, mimeType);
      console.log("Gemini extraction successful:", result);
      return result;
    } catch (error) {
      console.error("Gemini extraction failed:", error);
    }
  }

  // Fallback to OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("Falling back to OpenAI...");
      return await extractInvoiceDataWithOpenAI(imageData, mimeType);
    } catch (error) {
      console.error("OpenAI extraction failed:", error);
    }
  }

  // No AI provider available - return empty data for manual entry
  console.log("No AI provider available - returning empty data");
  return {
    vendorName: "",
    invoiceNumber: "",
    invoiceDate: "",
    dueDate: "",
    totalAmount: 0,
    currency: "HKD",
    lineItems: [],
    confidence: 0,
  };
}

// ==========================================
// Support Response Generation
// ==========================================

export async function generateSupportResponse(
  customerMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  knowledgeBase: string[]
): Promise<{ response: string; confidence: number; shouldEscalate: boolean }> {
  const kbContext = knowledgeBase.length > 0
    ? `\n\nKnowledge Base:\n${knowledgeBase.join("\n\n")}`
    : "";

  // Try Google Gemini
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are a helpful customer support assistant.${kbContext}

Previous conversation:
${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}

Customer: ${customerMessage}

Provide a professional, helpful response. If the request involves refunds, legal matters, complaints, or complex issues you cannot handle, prefix your response with [ESCALATE].

After your response, provide a confidence score between 0.0 and 1.0.

Format:
Response: [your response]
Confidence: [0.0-1.0]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const shouldEscalate = text.includes("[ESCALATE]");
      const responseText = text.replace("[ESCALATE]", "").trim();
      const confidenceMatch = responseText.match(/Confidence:\s*(0?\.\d+|1\.0)/);
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;
      const cleanResponse = responseText
        .replace(/Confidence:.*$/m, "")
        .replace(/^Response:\s*/m, "")
        .trim();

      return {
        response: cleanResponse,
        confidence,
        shouldEscalate: shouldEscalate || confidence < 0.7,
      };
    } catch (error) {
      console.error("Gemini support response failed:", error);
    }
  }

  // Fallback response
  return {
    response: "Thank you for your message. A team member will respond shortly.",
    confidence: 0.5,
    shouldEscalate: true,
  };
}
