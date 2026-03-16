const chromium = require("@sparticuz/chromium");
const { chromium: playwright } = require("playwright");

async function scrapeAttendance(username, password) {
  let browser;

  /* Detect environment */
  if (process.env.VERCEL) {
    /* Vercel serverless */
    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    /* Local development */
    browser = await playwright.launch({
      headless: true,
    });
  }

  const page = await browser.newPage();

  try {
    await page.goto("https://erp.cbit.org.in/", {
      waitUntil: "domcontentloaded",
    });

    await page.fill("#txtUserName", username);
    await page.click("#btnNext");

    await page.waitForTimeout(1500);

    const warning = await page.locator("#lblWarning").textContent().catch(() => "");

    if (warning?.includes("User Name is Incorrect")) {
      throw new Error("USERNAME_INCORRECT");
    }

    await page.fill("#txtPassword", password);
    await page.click("#btnSubmit");

    await page.waitForTimeout(1500);

    const passWarning = await page.locator("#lblWarning").textContent().catch(() => "");

    if (passWarning?.includes("Password is Incorrect")) {
      throw new Error("PASSWORD_INCORRECT");
    }

    await page.waitForSelector("#ctl00_cpStud_lnkStudentMain");
    await page.click("#ctl00_cpStud_lnkStudentMain");

    const studentName = await page.textContent(
      "#ctl00_cpHeader_ucStud_lblStudentName"
    );

    await page.waitForSelector("#ctl00_cpStud_grdSubject");

    const attendance = await page.evaluate(() => {
      const rows = document.querySelectorAll("#ctl00_cpStud_grdSubject tr");
      const data = [];

      rows.forEach((r) => {
        const cols = r.querySelectorAll("td");
        if (cols.length === 0) return;

        data.push(Array.from(cols).map((c) => c.innerText.trim()));
      });

      return data;
    });

    return { studentName, attendance };
  } finally {
    await browser.close();
  }
}

module.exports = scrapeAttendance;