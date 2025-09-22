// Paste this in your browser console on 797events.com BEFORE clicking Pay
// This will capture all the information Razorpay sees

(async () => {
  console.log("🔍 Razorpay Payment Debugging Info");
  console.log("===================================");

  console.log("📍 Current Page Info:");
  console.log("  URL:", window.location.href);
  console.log("  Origin:", window.location.origin);
  console.log("  Host:", window.location.host);
  console.log("  Protocol:", window.location.protocol);
  console.log("  Referrer:", document.referrer);

  console.log("\n🌐 Browser Info:");
  console.log("  User Agent:", navigator.userAgent);
  console.log("  Language:", navigator.language);

  console.log("\n🔑 Razorpay Key Check:");
  // Check if there's any Razorpay key visible in the page
  const scripts = Array.from(document.scripts);
  const razorpayScript = scripts.find(s => s.src.includes('checkout.razorpay.com'));
  console.log("  Razorpay script loaded:", !!razorpayScript);

  // Check for any global Razorpay variables
  try {
    if (window.Razorpay) {
      console.log("  window.Razorpay exists:", typeof window.Razorpay);
    } else {
      console.log("  window.Razorpay:", "not loaded yet");
    }
  } catch(e) {
    console.log("  Razorpay check error:", e.message);
  }

  console.log("\n🌍 Network Test (what headers will be sent):");
  try {
    const resp = await fetch("https://httpbin.org/anything", {
      method: "POST",
      body: JSON.stringify({test: "razorpay-debug"}),
      headers: {"Content-Type": "application/json"},
      mode: "cors"
    });
    const data = await resp.json();
    console.log("  Headers that remote servers see:");
    console.log("    Origin:", data.headers.Origin);
    console.log("    Referer:", data.headers.Referer);
    console.log("    Host:", data.headers.Host);
    console.log("    User-Agent:", data.headers['User-Agent']?.substring(0, 50) + '...');
  } catch (e) {
    console.log("  Network test failed:", e.message);
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Copy all this output");
  console.log("2. Try to trigger payment");
  console.log("3. Check Network tab for requests to checkout.razorpay.com");
  console.log("4. Save HAR file from Network tab");
  console.log("5. Compare Origin/Referer in actual Razorpay requests");

  // Set up network monitoring
  if (window.performance && window.performance.getEntriesByType) {
    console.log("\n🔍 Setting up network monitoring...");
    console.log("Will monitor for Razorpay requests...");

    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('razorpay.com')) {
        console.log("🌐 Razorpay API call detected:", url);
        console.log("  Current origin:", window.location.origin);
      }
      return originalFetch.apply(this, args);
    };
  }

  console.log("\n✅ Debug setup complete. Now trigger the payment!");
})();