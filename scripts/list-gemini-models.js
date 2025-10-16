const https = require("https");

const API_KEY = "AIzaSyBlZdopVA8anQHbJe907zjyobq3X-cMjI8";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = "";
  
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      
      if (response.models) {
        console.log("Available Gemini models:");
        console.log("=".repeat(60));
        
        response.models.forEach((model) => {
          if (model.supportedGenerationMethods && 
              model.supportedGenerationMethods.includes("generateContent")) {
            console.log(`\n✓ ${model.name}`);
            console.log(`  Display: ${model.displayName}`);
            console.log(`  Methods: ${model.supportedGenerationMethods.join(", ")}`);
          }
        });
      } else {
        console.error("Error:", data);
      }
    } catch (e) {
      console.error("Parse error:", e.message);
      console.log("Raw response:", data);
    }
  });
}).on("error", (err) => {
  console.error("Request error:", err.message);
});
