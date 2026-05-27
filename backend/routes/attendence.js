const express = require("express");
const scrapeAttendance = require("./scrapeAttendance");

const router = express.Router();

/* ─── Config ─────────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 5 * 60 * 1000;  // 5 minutes
const SCRAPE_TIMEOUT_MS = 60_000;          // 60 s — ERP is genuinely slow
const MAX_RETRIES = 1;               // retry once on transient failures

/* ─── In-memory cache ────────────────────────────────────────────────────── */
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/* ─── In-flight deduplication ────────────────────────────────────────────── */
const inflight = new Map();

/* ─── Scrape with timeout + retry ────────────────────────────────────────── */
async function scrapeWithTimeout(username, password, attempt = 0) {
  let timedOut = false;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      timedOut = true;
      const e = new Error("Scrape timed out");
      e.code = "TIMEOUT";
      reject(e);
    }, SCRAPE_TIMEOUT_MS)
  );

  try {
    return await Promise.race([
      scrapeAttendance(username, password),
      timeoutPromise,
    ]);
  } catch (err) {
    const isAuthError =
      err.code === "USERNAME_INCORRECT" || err.code === "PASSWORD_INCORRECT";
    if (!isAuthError && !timedOut && attempt < MAX_RETRIES) {
      console.log(`[attendance] attempt ${attempt + 1} failed (${err.code || err.message}), retrying…`);
      return scrapeWithTimeout(username, password, attempt + 1);
    }
    throw err;
  }
}

/* ─── Route ──────────────────────────────────────────────────────────────── */
router.post("/attendance", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const cacheKey = `${username}:${password}`;

  /* 1. Return cached result immediately */
  const cached = getCached(cacheKey);
  if (cached) {
    res.setHeader("X-Cache", "HIT");
    return res.json(cached);
  }

  /* 2. Deduplicate concurrent requests for the same user */
  if (inflight.has(cacheKey)) {
    try {
      const data = await inflight.get(cacheKey);
      return res.json(data);
    } catch (error) {
      return handleError(res, error);
    }
  }

  /* 3. Scrape */
  const scrapePromise = scrapeWithTimeout(username, password);
  inflight.set(cacheKey, scrapePromise);

  try {
    const data = await scrapePromise;
    setCached(cacheKey, data);
    res.setHeader("X-Cache", "MISS");
    return res.json(data);
  } catch (error) {
    console.error("[attendance] final error:", error.code || error.message);
    return handleError(res, error);
  } finally {
    inflight.delete(cacheKey);
  }
});

function handleError(res, error) {
  if (error.code === "USERNAME_INCORRECT")
    return res.status(401).json({ error: "Username is incorrect." });

  if (error.code === "PASSWORD_INCORRECT")
    return res.status(401).json({ error: "Password is incorrect." });

  if (error.code === "TIMEOUT")
    return res.status(504).json({
      error: "ERP is taking too long. Try fetching again — it usually works on a second attempt.",
    });

  return res.status(503).json({
    error: "ERP service unavailable. Please try again later.",
  });
}

module.exports = router;