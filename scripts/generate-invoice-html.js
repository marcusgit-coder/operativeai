const fs = require('fs');
const path = require('path');

const invoices = [
  {
    filename: 'invoice-001-office-supplies.html',
    vendorName: 'ABC Office Supplies Ltd.',
    vendorAddress: '123 Hennessy Road, Wan Chai',
    vendorCity: 'Hong Kong',
    vendorPhone: '+852 2123 4567',
    vendorEmail: 'sales@abcoffice.hk',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: '15 October 2024',
    dueDate: '14 November 2024',
    billTo: {
      company: 'Your Company Ltd.',
      address: '456 Queen\'s Road Central',
      city: 'Hong Kong',
      phone: '+852 2987 6543'
    },
    lineItems: [
      { description: 'A4 Paper (Box of 5 reams)', quantity: 10, unitPrice: 120.00 },
      { description: 'Blue Pens (Pack of 12)', quantity: 20, unitPrice: 35.00 },
      { description: 'Stapler (Heavy Duty)', quantity: 5, unitPrice: 85.00 },
      { description: 'File Folders (Box of 25)', quantity: 15, unitPrice: 45.00 }
    ],
    currency: 'HKD',
    notes: 'Payment due within 30 days. Bank transfer preferred.'
  },
  {
    filename: 'invoice-002-it-services.html',
    vendorName: 'TechPro Solutions Limited',
    vendorAddress: '88 Lockhart Road, Causeway Bay',
    vendorCity: 'Hong Kong',
    vendorPhone: '+852 3456 7890',
    vendorEmail: 'billing@techpro.hk',
    invoiceNumber: 'TP-2024-456',
    invoiceDate: '18 October 2024',
    dueDate: '17 November 2024',
    billTo: {
      company: 'Your Company Ltd.',
      address: '456 Queen\'s Road Central',
      city: 'Hong Kong',
      phone: '+852 2987 6543'
    },
    lineItems: [
      { description: 'Cloud Server Hosting (Annual)', quantity: 1, unitPrice: 48000.00 },
      { description: 'IT Security Audit', quantity: 1, unitPrice: 28500.00 },
      { description: 'Software License Renewal', quantity: 5, unitPrice: 3850.00 },
      { description: 'Technical Support Hours', quantity: 25, unitPrice: 450.00 }
    ],
    currency: 'HKD',
    notes: 'Services rendered for October 2024. Payment terms: 30 days.'
  },
  {
    filename: 'invoice-003-catering.html',
    vendorName: 'Gourmet Catering Co.',
    vendorAddress: '25 Canton Road, Tsim Sha Tsui',
    vendorCity: 'Hong Kong',
    vendorPhone: '+852 2234 5678',
    vendorEmail: 'orders@gourmetcatering.hk',
    invoiceNumber: 'GC-2024-789',
    invoiceDate: '20 October 2024',
    dueDate: '04 November 2024',
    billTo: {
      company: 'Your Company Ltd.',
      address: '456 Queen\'s Road Central',
      city: 'Hong Kong',
      phone: '+852 2987 6543'
    },
    lineItems: [
      { description: 'Executive Lunch (50 pax)', quantity: 1, unitPrice: 42500.00 },
      { description: 'Coffee & Tea Service', quantity: 3, unitPrice: 1800.00 },
      { description: 'Premium Dessert Platter', quantity: 5, unitPrice: 2250.00 },
      { description: 'Beverage Package (Non-alcoholic)', quantity: 50, unitPrice: 185.12 }
    ],
    currency: 'HKD',
    notes: 'Event date: 25 October 2024. Payment due within 15 days.'
  },
  {
    filename: 'invoice-004-equipment-rental.html',
    vendorName: 'Premier Equipment Rentals',
    vendorAddress: '12 Kwun Tong Road, Kwun Tong',
    vendorCity: 'Hong Kong',
    vendorPhone: '+852 2345 6789',
    vendorEmail: 'rentals@premier-equip.hk',
    invoiceNumber: 'PER-2024-234',
    invoiceDate: '22 October 2024',
    dueDate: '21 November 2024',
    billTo: {
      company: 'Your Company Ltd.',
      address: '456 Queen\'s Road Central',
      city: 'Hong Kong',
      phone: '+852 2987 6543'
    },
    lineItems: [
      { description: 'Projector & Screen (3 days)', quantity: 2, unitPrice: 4500.00 },
      { description: 'Sound System Rental (3 days)', quantity: 1, unitPrice: 12500.00 },
      { description: 'Lighting Equipment Package', quantity: 1, unitPrice: 18750.00 },
      { description: 'Chairs (Conference, 100 units)', quantity: 1, unitPrice: 8500.00 },
      { description: 'Tables (Banquet, 20 units)', quantity: 1, unitPrice: 6750.00 },
      { description: 'Stage Platform (6m x 4m)', quantity: 1, unitPrice: 15000.00 },
      { description: 'Technical Support (3 days)', quantity: 3, unitPrice: 8842.67 },
      { description: 'Delivery & Setup Fee', quantity: 1, unitPrice: 9500.00 },
      { description: 'Equipment Insurance', quantity: 1, unitPrice: 3685.33 }
    ],
    currency: 'HKD',
    notes: 'Rental period: 25-27 October 2024. Equipment must be returned by 28 Oct.'
  },
  {
    filename: 'invoice-005-consulting.html',
    vendorName: 'Elite Business Consultants',
    vendorAddress: '77 Des Voeux Road Central',
    vendorCity: 'Hong Kong',
    vendorPhone: '+852 2456 7890',
    vendorEmail: 'invoicing@elitebiz.hk',
    invoiceNumber: 'EBC-2024-567',
    invoiceDate: '25 October 2024',
    dueDate: '24 November 2024',
    billTo: {
      company: 'Your Company Ltd.',
      address: '456 Queen\'s Road Central',
      city: 'Hong Kong',
      phone: '+852 2987 6543'
    },
    lineItems: [
      { description: 'Strategic Planning Workshop (2 days)', quantity: 1, unitPrice: 95000.00 },
      { description: 'Market Research Analysis', quantity: 1, unitPrice: 68500.00 },
      { description: 'Financial Modeling Service', quantity: 1, unitPrice: 42000.00 },
      { description: 'Executive Coaching Sessions (8 hours)', quantity: 8, unitPrice: 3850.00 },
      { description: 'Business Process Review', quantity: 1, unitPrice: 21720.00 }
    ],
    currency: 'HKD',
    notes: 'Project completion: October 2024. Payment terms: 30 days from invoice date.'
  }
];

function calculateTotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
}

function generateInvoiceHTML(invoice) {
  const total = calculateTotal(invoice.lineItems);
  const subtotal = total;
  const tax = 0; // Hong Kong has no sales tax/VAT
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: white;
            padding: 40px;
            color: #333;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #ddd;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .vendor-info h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .vendor-info p {
            color: #666;
            line-height: 1.6;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-details h2 {
            color: #2563eb;
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .invoice-details p {
            color: #666;
            line-height: 1.8;
        }
        
        .invoice-details strong {
            color: #333;
        }
        
        .bill-to {
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-left: 4px solid #2563eb;
        }
        
        .bill-to h3 {
            color: #2563eb;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .bill-to p {
            color: #666;
            line-height: 1.6;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        thead {
            background: #2563eb;
            color: white;
        }
        
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        th.right, td.right {
            text-align: right;
        }
        
        tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:hover {
            background: #f9fafb;
        }
        
        td {
            padding: 15px;
            color: #666;
        }
        
        .totals {
            margin-left: auto;
            width: 350px;
            margin-bottom: 30px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-row.grand-total {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
            border-top: 3px solid #2563eb;
            border-bottom: 3px solid #2563eb;
            padding: 15px 0;
            margin-top: 10px;
        }
        
        .notes {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin-top: 30px;
        }
        
        .notes h4 {
            color: #92400e;
            margin-bottom: 10px;
        }
        
        .notes p {
            color: #78350f;
            line-height: 1.6;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 14px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="vendor-info">
                <h1>${invoice.vendorName}</h1>
                <p>${invoice.vendorAddress}<br>
                ${invoice.vendorCity}<br>
                Phone: ${invoice.vendorPhone}<br>
                Email: ${invoice.vendorEmail}</p>
            </div>
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <p>
                    <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
                    <strong>Date:</strong> ${invoice.invoiceDate}<br>
                    <strong>Due Date:</strong> ${invoice.dueDate}
                </p>
            </div>
        </div>
        
        <div class="bill-to">
            <h3>BILL TO:</h3>
            <p>
                <strong>${invoice.billTo.company}</strong><br>
                ${invoice.billTo.address}<br>
                ${invoice.billTo.city}<br>
                Phone: ${invoice.billTo.phone}
            </p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="right">Quantity</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.lineItems.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="right">${item.quantity}</td>
                    <td class="right">${invoice.currency} ${item.unitPrice.toFixed(2)}</td>
                    <td class="right">${invoice.currency} ${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="totals-row">
                <span>Subtotal:</span>
                <span>${invoice.currency} ${subtotal.toFixed(2)}</span>
            </div>
            <div class="totals-row">
                <span>Tax (0%):</span>
                <span>${invoice.currency} 0.00</span>
            </div>
            <div class="totals-row grand-total">
                <span>TOTAL:</span>
                <span>${invoice.currency} ${total.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="notes">
            <h4>Payment Notes</h4>
            <p>${invoice.notes}</p>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>`;
}

// Generate all invoice HTML files
const outputDir = path.join(__dirname, '..', 'generated-invoices');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

invoices.forEach(invoice => {
  const html = generateInvoiceHTML(invoice);
  const filePath = path.join(outputDir, invoice.filename);
  fs.writeFileSync(filePath, html);
  console.log(`✓ Generated: ${invoice.filename}`);
});

console.log(`\n✅ All ${invoices.length} invoices generated in: ${outputDir}`);
console.log('\nTo create images:');
console.log('1. Open each HTML file in your browser');
console.log('2. Press Ctrl+P (Windows) or Cmd+P (Mac)');
console.log('3. Select "Save as PDF" or take a screenshot');
console.log('4. Or use the print-to-image.js script');
