// scrapeAttendance.js
const chromium = require("@sparticuz/chromium");
const { chromium: playwright } = require("playwright");

// Global persistent browser instance
let persistentBrowser = null;

/**
 * Initializes and manages a single persistent browser instance.
 * This saves memory by not launching a brand new Chromium instance for every scrape.
 */
async function getBrowser() {
  // Close invalid or closed browser instances
  if (persistentBrowser) {
    try {
      if (persistentBrowser.isClosed()) {
        persistentBrowser = null;
      }
    } catch (e) {
      // If .isClosed() itself fails (rare but happens), force cleanup
      persistentBrowser = null;
    }
  }

  // Launch a new browser if one doesn't exist
  if (!persistentBrowser) {
    const isVercel = !!process.env.VERCEL;

    console.log(`[attendance] Launching new browser (${isVercel ? 'Vercel' : 'Local/VPS'})`);

    persistentBrowser = await playwright.launch({
      args: [
        ...chromium.args,
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-webgl",
        "--single-process",
        "--disable-extensions",
      ],
      executablePath: isVercel ? await chromium.executablePath() : undefined,
      headless: true,
    });
  }

  return persistentBrowser;
}

/**
 * Scrapes attendance for a given user using an isolated browser context.
 */
async function scrapeAttendance(username, password) {
  let context = null;
  let page = null;
  const browser = await getBrowser();

  try {
    // 1. Create an isolated context so cookies/sessions don't overlap
    // This is the crucial fix for the "Service Unavailable" concurrency error
    context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });

    // 2. Open the page inside the isolated context
    page = await context.newPage();
    await page.setDefaultNavigationTimeout(15000);
    await page.setDefaultTimeout(10000);

    // Navigate to ERP
    await page.goto("https://erp.cbit.org.in/", {
      waitUntil: "domcontentloaded",
      timeout: 12000,
    });

    // Enter Username
    await page.fill("#txtUserName", username);
    await page.click("#btnNext");

    // Wait for password field OR an error warning
    await page.waitForSelector("#txtPassword, #lblWarning", { timeout: 8000 });

    const usernameWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (usernameWarning.includes("User Name is Incorrect")) {
      throw Object.assign(new Error("USERNAME_INCORRECT"), { code: "USERNAME_INCORRECT" });
    }

    // Enter Password
    await page.fill("#txtPassword", password);
    await page.click("#btnSubmit");

    // Wait for login success (Student Main Link) OR an error warning
    await page.waitForSelector("#lblWarning, #ctl00_cpStud_lnkStudentMain", { timeout: 10000 });

    const passwordWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (passwordWarning.includes("Password is Incorrect")) {
      throw Object.assign(new Error("PASSWORD_INCORRECT"), { code: "PASSWORD_INCORRECT" });
    }

    // Navigate to attendance page
    await page.click("#ctl00_cpStud_lnkStudentMain");
    await page.waitForSelector("#ctl00_cpStud_grdSubject", { timeout: 12000 });

    // Extract Data
    const [studentName, attendance] = await Promise.all([
      page.textContent("#ctl00_cpHeader_ucStud_lblStudentName").catch(() => "Student"),
      page.evaluate(() => {
        const rows = document.querySelectorAll("#ctl00_cpStud_grdSubject tr");
        const data = [];
        rows.forEach((row) => {
          const cols = row.querySelectorAll("td");
          if (cols.length < 6) return; // Skip headers or empty rows
          data.push(Array.from(cols).map((c) => c.innerText.trim()));
        });
        return data;
      }),
    ]);

    return {
      studentName: studentName.trim(),
      attendance,
      timestamp: new Date().toISOString(),
    };

  } catch (err) {
    console.error("[attendance] Scrape error:", err.message);
    if (!err.code) err.code = "SCRAPE_FAILED";
    throw err;
  } finally {
    // 3. Always close the context to free up memory and prevent zombie processes
    // Closing the context automatically closes any pages inside it
    if (context) {
      await context.close().catch(() => { });
    }
  }
}

// Cleanup on process exit (e.g., when the server restarts)
process.on("SIGTERM", async () => {
  if (persistentBrowser) {
    console.log("[attendance] Shutting down persistent browser...");
    await persistentBrowser.close().catch(() => { });
    persistentBrowser = null;
  }
});

// Export exactly matching the required standard
module.exports = scrapeAttendance;