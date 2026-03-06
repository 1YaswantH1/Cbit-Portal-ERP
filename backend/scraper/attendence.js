const express = require("express");
const router = express.Router();

const scrapeAttendance = require("../scraper/attendance");

router.post("/", async (req, res) => {

    const { username, password } = req.body;

    try {

        const data = await scrapeAttendance(username, password);

        res.json({
            success: true,
            attendance: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Scraping failed"
        });

    }

});

module.exports = router;