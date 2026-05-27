// scrapeAttendance.js
const chromium = require("@sparticuz/chromium");
const { chromium: playwright } = require("playwright");

let persistentBrowser = null;

async function getBrowser() {
  // Close invalid or closed browser
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

  if (!persistentBrowser) {
    const isVercel = !!process.env.VERCEL;

    console.log(`[attendance] Launching new browser (${isVercel ? 'Vercel' : 'Local'})`);

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

async function scrapeAttendance(username, password) {
  let page = null;
  const browser = await getBrowser();

  try {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(15000);
    await page.setDefaultTimeout(10000);

    await page.goto("https://erp.cbit.org.in/", {
      waitUntil: "domcontentloaded",
      timeout: 12000,
    });

    await page.fill("#txtUserName", username);
    await page.click("#btnNext");

    await page.waitForSelector("#txtPassword, #lblWarning", { timeout: 8000 });

    const usernameWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (usernameWarning.includes("User Name is Incorrect")) {
      throw Object.assign(new Error("USERNAME_INCORRECT"), { code: "USERNAME_INCORRECT" });
    }

    await page.fill("#txtPassword", password);
    await page.click("#btnSubmit");

    await page.waitForSelector("#lblWarning, #ctl00_cpStud_lnkStudentMain", { timeout: 10000 });

    const passwordWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (passwordWarning.includes("Password is Incorrect")) {
      throw Object.assign(new Error("PASSWORD_INCORRECT"), { code: "PASSWORD_INCORRECT" });
    }

    await page.click("#ctl00_cpStud_lnkStudentMain");
    await page.waitForSelector("#ctl00_cpStud_grdSubject", { timeout: 12000 });

    const [studentName, attendance] = await Promise.all([
      page.textContent("#ctl00_cpHeader_ucStud_lblStudentName").catch(() => "Student"),
      page.evaluate(() => {
        const rows = document.querySelectorAll("#ctl00_cpStud_grdSubject tr");
        const data = [];
        rows.forEach((row) => {
          const cols = row.querySelectorAll("td");
          if (cols.length < 6) return;
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
    if (page) {
      await page.close().catch(() => { });
    }
  }
}

// Cleanup on process exit
process.on("SIGTERM", async () => {
  if (persistentBrowser) {
    await persistentBrowser.close().catch(() => { });
    persistentBrowser = null;
  }
});

module.exports = scrapeAttendance;