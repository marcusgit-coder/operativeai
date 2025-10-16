// Simple script to convert HTML invoices to images using Puppeteer
// Run: node scripts/html-to-images.js

const fs = require('fs');
const path = require('path');

console.log('Setting up Puppeteer...');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('\n❌ Puppeteer not installed!');
  console.log('\nInstall it with:');
  console.log('  npm install puppeteer\n');
  console.log('OR use manual method:');
  console.log('  1. Open HTML files in browser from: generated-invoices/');
  console.log('  2. Right-click > "Print" > "Save as PDF"');
  console.log('  3. Upload PDFs to the app\n');
  process.exit(1);
}

const inputDir = path.join(__dirname, '..', 'generated-invoices');
const outputDir = path.join(__dirname, '..', 'generated-invoices', 'images');

async function convertHTMLtoImages() {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all HTML files
  const htmlFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found. Run generate-invoice-html.js first!');
    return;
  }

  console.log(`Found ${htmlFiles.length} invoice HTML files\n`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new'
  });

  for (const htmlFile of htmlFiles) {
    const inputPath = path.join(inputDir, htmlFile);
    const outputPath = path.join(outputDir, htmlFile.replace('.html', '.png'));
    
    console.log(`Converting: ${htmlFile}...`);
    
    const page = await browser.newPage();
    
    // Set viewport to A4-ish dimensions
    await page.setViewport({
      width: 800,
      height: 1100,
      deviceScaleFactor: 2 // For better quality
    });
    
    // Load HTML file
    await page.goto(`file://${inputPath}`, {
      waitUntil: 'networkidle0'
    });
    
    // Take screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });
    
    await page.close();
    
    console.log(`  ✓ Saved: ${path.basename(outputPath)}`);
  }

  await browser.close();
  
  console.log(`\n✅ All invoices converted to images!`);
  console.log(`📁 Location: ${outputDir}\n`);
  console.log('You can now upload these PNG files to test AI extraction!');
}

convertHTMLtoImages().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
