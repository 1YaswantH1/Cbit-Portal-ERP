const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const URL = "https://www.cbit.ac.in/placement_post/notice-board/";

router.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(URL);

    const $ = cheerio.load(data);

    const results = [];

    $(".adm-right-col ul li a").each((i, el) => {
      const title = $(el).text().trim();
      const link = $(el).attr("href");

      if (link && link.endsWith(".pdf")) {
        results.push({
          title,
          link,
        });
      }
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to scrape placements" });
  }
});

module.exports = router;
