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
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

module.exports = router;
