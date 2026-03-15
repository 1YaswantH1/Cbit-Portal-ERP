const express = require("express");
const scrapeAttendance = require("./scrapeAttendance");

const router = express.Router();

router.post("/attendance", async (req, res) => {
  const { username, password } = req.body;

  try {
    const data = await scrapeAttendance(username, password);

    res.json(data);
  } catch (error) {
    console.log(error);

    if (error.code === "USERNAME_INCORRECT") {
      return res.status(401).json({
        error: "Username is incorrect",
      });
    }

    if (error.code === "PASSWORD_INCORRECT") {
      return res.status(401).json({
        error: "Password is incorrect",
      });
    }

    res.status(503).json({
      error: "ERP service unavailable. Please try again later.",
    });
  }
});

module.exports = router;
