from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get("https://erp.cbit.org.in/")

wait = WebDriverWait(driver, 10)

# USERNAME PAGE
username = wait.until(EC.visibility_of_element_located((By.ID, "txtUserName")))
username.send_keys("160122771111")

next_btn = driver.find_element(By.ID, "btnNext")
next_btn.click()

# wait until username field disappears (page transition)
wait.until(EC.staleness_of(username))

# PASSWORD PAGE
password = wait.until(EC.visibility_of_element_located((By.ID, "txtPassword")))
password.send_keys("160122771111")

#  login
login_btn = wait.until(EC.element_to_be_clickable((By.ID, "btnSubmit")))
login_btn.click()

# dashboard
dashboard_link = wait.until(
    EC.element_to_be_clickable((By.ID, "ctl00_cpStud_lnkStudentMain"))
)
dashboard_link.click()

# table of attendance
table = wait.until(EC.presence_of_element_located((By.ID, "ctl00_cpStud_grdSubject")))


rows = table.find_elements(By.TAG_NAME, "tr")

for row in rows:
    cols = row.find_elements(By.TAG_NAME, "td")
    data = [col.text for col in cols]
    print(data)
