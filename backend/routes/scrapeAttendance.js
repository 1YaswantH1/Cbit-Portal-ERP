// scrapeAttendance.js
const chromium = require("@sparticuz/chromium");
const { chromium: playwright } = require("playwright");

let persistentBrowser = null;   // Browser reuse

async function getBrowser() {
  if (persistentBrowser && !persistentBrowser.isClosed()) {
    return persistentBrowser;
  }

  const isVercel = !!process.env.VERCEL;

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
      "--disable-plugins",
    ],
    executablePath: isVercel ? await chromium.executablePath() : undefined,
    headless: true,
  });

  return persistentBrowser;
}

async function scrapeAttendance(username, password) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Optimize page load
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setDefaultNavigationTimeout(15000);
  await page.setDefaultTimeout(10000);

  try {
    // 1. Go to login
    await page.goto("https://erp.cbit.org.in/", {
      waitUntil: "domcontentloaded",
      timeout: 12000,
    });

    // Fill username + next
    await page.fill("#txtUserName", username);
    await page.click("#btnNext");

    // Smart wait
    await page.waitForSelector("#txtPassword, #lblWarning", { timeout: 7000 });

    const usernameWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (usernameWarning.includes("User Name is Incorrect")) {
      throw Object.assign(new Error("USERNAME_INCORRECT"), { code: "USERNAME_INCORRECT" });
    }

    // Fill password + submit
    await page.fill("#txtPassword", password);
    await page.click("#btnSubmit");

    await page.waitForSelector("#lblWarning, #ctl00_cpStud_lnkStudentMain", { timeout: 10000 });

    const passwordWarning = await page.locator("#lblWarning").textContent().catch(() => "");
    if (passwordWarning.includes("Password is Incorrect")) {
      throw Object.assign(new Error("PASSWORD_INCORRECT"), { code: "PASSWORD_INCORRECT" });
    }

    // Navigate to attendance
    await page.click("#ctl00_cpStud_lnkStudentMain");

    await page.waitForSelector("#ctl00_cpStud_grdSubject", { timeout: 12000 });

    // Extract data in one go
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
    if (!err.code) err.code = "SCRAPE_FAILED";
    throw err;
  } finally {
    // Don't close page immediately — keep browser alive
    await page.close().catch(() => { });
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (persistentBrowser) await persistentBrowser.close();
});

module.exports = scrapeAttendance;