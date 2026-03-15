const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

/* ───────────────── HELPERS ───────────────── */

async function safeText(el) {
  try {
    return await el.getText();
  } catch {
    return "";
  }
}

async function waitVisible(driver, locator, label, timeout = 20000) {
  const el = await driver.wait(
    until.elementLocated(locator),
    timeout,
    `Timeout waiting for ${label}`,
  );

  await driver.wait(
    until.elementIsVisible(el),
    timeout,
    `${label} located but not visible`,
  );

  return el;
}

async function robustClick(driver, el) {
  try {
    await el.click();
  } catch {
    await driver.executeScript("arguments[0].click()", el);
  }
}

/* ───────────── LOGIN ERROR CHECK ───────────── */

async function assertNoLoginError(driver) {
  const warning = await driver.findElements(By.id("lblWarning"));

  if (warning.length > 0) {
    const text = (await safeText(warning[0])).trim();

    if (text.includes("User Name is Incorrect")) {
      const err = new Error("USERNAME_INCORRECT");
      err.code = "USERNAME_INCORRECT";
      throw err;
    }

    if (text.includes("Password is Incorrect")) {
      const err = new Error("PASSWORD_INCORRECT");
      err.code = "PASSWORD_INCORRECT";
      throw err;
    }
  }
}

/* ───────────────── MAIN ───────────────── */

async function scrapeAttendance(username, password, retries = 2) {
  let driver;

  try {
    const options = new chrome.Options();

    options.addArguments(
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
      "--disable-blink-features=AutomationControlled",
    );

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({
      pageLoad: 30000,
      script: 20000,
    });

    /* STEP 1 - Open ERP */
    await driver.get("https://erp.cbit.org.in/");

    /* STEP 2 - Enter username */
    const usernameField = await waitVisible(
      driver,
      By.id("txtUserName"),
      "username field",
    );

    await usernameField.clear();
    await usernameField.sendKeys(username);

    /* STEP 3 - Click Next */
    const nextBtn = await waitVisible(driver, By.id("btnNext"), "next button");
    await robustClick(driver, nextBtn);

    /* Check username error */
    await driver.sleep(1200);
    await assertNoLoginError(driver);

    /* STEP 4 - Password */
    const passwordField = await waitVisible(
      driver,
      By.id("txtPassword"),
      "password field",
      25000,
    );

    await passwordField.clear();
    await passwordField.sendKeys(password);

    /* STEP 5 - Submit */
    const submitBtn = await waitVisible(
      driver,
      By.id("btnSubmit"),
      "submit button",
    );

    await robustClick(driver, submitBtn);

    /* Check password error */
    await driver.sleep(1500);
    await assertNoLoginError(driver);

    /* STEP 6 - Dashboard */
    const dashboard = await waitVisible(
      driver,
      By.id("ctl00_cpStud_lnkStudentMain"),
      "dashboard link",
      30000,
    );

    await robustClick(driver, dashboard);

    /* STEP 7 - Student name */
    const nameEl = await waitVisible(
      driver,
      By.id("ctl00_cpHeader_ucStud_lblStudentName"),
      "student name",
    );

    const studentName = await safeText(nameEl);

    /* STEP 8 - Attendance table */
    const table = await waitVisible(
      driver,
      By.id("ctl00_cpStud_grdSubject"),
      "attendance table",
    );

    const attendance = await driver.executeScript(
      `
      const rows = arguments[0].querySelectorAll("tr");
      const result = [];
      for(const r of rows){
        const cols = r.querySelectorAll("td");
        if(cols.length === 0) continue;
        result.push(Array.from(cols).map(c => c.innerText.trim()));
      }
      return result;
    `,
      table,
    );

    return { studentName, attendance };
  } catch (error) {
    console.log("Scraping error:", error.message);

    if (retries > 0 && !error.code) {
      await new Promise((r) => setTimeout(r, 2000));
      return scrapeAttendance(username, password, retries - 1);
    }

    throw error;
  } finally {
    if (driver) await driver.quit();
  }
}

module.exports = scrapeAttendance;
