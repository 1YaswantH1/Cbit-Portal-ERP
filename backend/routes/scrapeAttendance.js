const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/** Safe getText — returns "" instead of throwing if element is stale */
async function safeText(el) {
  try {
    return await el.getText();
  } catch {
    return "";
  }
}

/**
 * Wait for an element to be present AND visible.
 * Throws a descriptive error naming the field.
 */
async function waitVisible(driver, locator, label, timeout = 20000) {
  try {
    const el = await driver.wait(
      until.elementLocated(locator),
      timeout,
      `Timed out waiting for element: ${label}`,
    );
    await driver.wait(
      until.elementIsVisible(el),
      timeout,
      `Element found but not visible: ${label}`,
    );
    return el;
  } catch (e) {
    throw new Error(`[${label}] ${e.message}`);
  }
}

/**
 * Click with JS fallback — avoids ElementClickInterceptedException
 * on overlays / iframes.
 */
async function robustClick(driver, el) {
  try {
    await el.click();
  } catch {
    await driver.executeScript("arguments[0].click();", el);
  }
}

/**
 * Wait for the URL to change away from a pattern.
 */
async function waitUrlChangesFrom(driver, pattern, timeout = 20000) {
  await driver.wait(
    async () => {
      const url = await driver.getCurrentUrl();
      return !url.includes(pattern);
    },
    timeout,
    `URL still contains "${pattern}" after ${timeout}ms`,
  );
}

/**
 * Detect login error messages on the page and throw early
 * rather than timing-out on the next element.
 */
async function assertNoLoginError(driver) {
  const errorSelectors = [
    By.id("lblError"),
    By.id("lblMessage"),
    By.css(".error-message"),
    By.css("[class*='error']"),
  ];
  for (const sel of errorSelectors) {
    try {
      const els = await driver.findElements(sel);
      for (const el of els) {
        const text = (await safeText(el)).trim();
        if (text.length > 0) throw new Error(`Login error on page: "${text}"`);
      }
    } catch (e) {
      if (e.message.startsWith("Login error")) throw e;
      // selector not found — fine
    }
  }
}

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */

async function scrapeAttendance(username, password, retries = 3) {
  let driver;

  try {
    /* ── BUILD DRIVER ── */
    const options = new chrome.Options();
    options.addArguments(
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
      "--disable-blink-features=AutomationControlled", // avoid bot-detection
      "--disable-extensions",
      "--disable-popup-blocking",
      "--ignore-certificate-errors",
    );
    // Reduce memory pressure on constrained servers
    options.addArguments("--js-flags=--max-old-space-size=512");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({
      implicit: 0, // we use explicit waits — implicit=0 avoids double-wait confusion
      pageLoad: 30000,
      script: 20000,
    });

    /* ── STEP 1: Load ERP ── */
    await driver.get("https://erp.cbit.org.in/");

    /* ── STEP 2: Username field ── */
    const usernameField = await waitVisible(
      driver,
      By.id("txtUserName"),
      "Username field",
    );
    await usernameField.clear();
    await usernameField.sendKeys(username);

    /* ── STEP 3: Click "Next" ── */
    const nextBtn = await waitVisible(driver, By.id("btnNext"), "Next button");
    await robustClick(driver, nextBtn);

    /* ── STEP 4: Wait for password field to appear (2-step login) ── */
    // The page may do a partial DOM swap or a full reload — wait for the
    // password field to be present AND interactable, not just located.
    const passwordField = await waitVisible(
      driver,
      By.id("txtPassword"),
      "Password field",
      25000,
    );

    // Extra guard: wait until it's actually enabled/editable
    await driver.wait(
      until.elementIsEnabled(passwordField),
      10000,
      "Password field located but not enabled",
    );

    await passwordField.clear();
    await passwordField.sendKeys(password);

    /* ── STEP 5: Submit ── */
    const submitBtn = await waitVisible(
      driver,
      By.id("btnSubmit"),
      "Submit button",
    );
    await robustClick(driver, submitBtn);

    /* ── STEP 6: Confirm login succeeded ── */
    // Give the page a moment to show any error before we check
    await driver.sleep(1500);
    await assertNoLoginError(driver);

    // Wait for URL to leave the login page
    await waitUrlChangesFrom(driver, "Login", 20000);

    /* ── STEP 7: Dashboard link ── */
    // After redirect the page may still be rendering — poll for the element
    // with a generous timeout and a visible+enabled check.
    const dashboard = await waitVisible(
      driver,
      By.id("ctl00_cpStud_lnkStudentMain"),
      "Dashboard link",
      30000, // bumped up — post-login render is slow
    );

    // Scroll into view before clicking (fixes intercepted-click on some viewports)
    await driver.executeScript("arguments[0].scrollIntoView(true);", dashboard);
    await driver.sleep(300);
    await robustClick(driver, dashboard);

    /* ── STEP 8: Student name ── */
    const nameEl = await waitVisible(
      driver,
      By.id("ctl00_cpHeader_ucStud_lblStudentName"),
      "Student name",
      15000,
    );
    const studentName = await safeText(nameEl);

    /* ── STEP 9: Attendance table ── */
    const table = await waitVisible(
      driver,
      By.id("ctl00_cpStud_grdSubject"),
      "Attendance table",
      25000,
    );

    // Grab all rows in one JS call — much faster than N individual findElements
    const attendance = await driver.executeScript(
      `
      const rows = arguments[0].querySelectorAll("tr");
      const result = [];
      for (const row of rows) {
        const cols = row.querySelectorAll("td");
        if (cols.length === 0) continue;
        result.push(Array.from(cols).map(c => c.innerText.trim()));
      }
      return result;
    `,
      table,
    );

    return { studentName, attendance };
  } catch (error) {
    console.error(`Scraping failed (retries left: ${retries}):`, error.message);

    if (driver) {
      // Capture a screenshot to help debug — save path is logged, not thrown
      try {
        const img = await driver.takeScreenshot();
        const fs = require("fs");
        const path = `./debug-screenshot-${Date.now()}.png`;
        fs.writeFileSync(path, img, "base64");
        console.error("Debug screenshot saved:", path);
      } catch {
        /* screenshot optional */
      }
    }

    if (retries > 0) {
      const backoff = (4 - retries) * 2000; // 2s, 4s, 6s back-off
      console.log(`Retrying in ${backoff}ms…`);
      await new Promise((r) => setTimeout(r, backoff));
      return scrapeAttendance(username, password, retries - 1);
    }

    throw new Error(`Attendance scrape failed: ${error.message}`);
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch {
        /* ignore quit errors */
      }
    }
  }
}

module.exports = scrapeAttendance;
