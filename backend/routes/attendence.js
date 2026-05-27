// attendanceRoute.js
const express = require("express");
const scrapeAttendance = require("./scrapeAttendance");

const router = express.Router();

/* ─── Config ─────────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const SCRAPE_TIMEOUT_MS = 60_000; // 60 sec
const MAX_RETRIES = 1;

/* ─── Cache ──────────────────────────────────────────────────────────────── */
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);

  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCached(key, data) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/* ─── Inflight Requests ──────────────────────────────────────────────────── */
const inflight = new Map();

/* ─── Scrape With Retry + Timeout ───────────────────────────────────────── */
async function scrapeWithTimeout(username, password, attempt = 0) {
  let timedOut = false;
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;

      const err = new Error("Scrape timed out");
      err.code = "TIMEOUT";

      reject(err);
    }, SCRAPE_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      scrapeAttendance(username, password),
      timeoutPromise,
    ]);

    clearTimeout(timeoutId);

    return result;
  } catch (err) {
    clearTimeout(timeoutId);

    const isAuthError =
      err.code === "USERNAME_INCORRECT" ||
      err.code === "PASSWORD_INCORRECT";

    const shouldRetry =
      !isAuthError &&
      !timedOut &&
      attempt < MAX_RETRIES;

    if (shouldRetry) {
      console.log(
        `[attendance] attempt ${attempt + 1
        } failed (${err.code || err.message}), retrying...`
      );

      return scrapeWithTimeout(
        username,
        password,
        attempt + 1
      );
    }

    throw err;
  }
}

/* ─── Route ──────────────────────────────────────────────────────────────── */
router.post("/attendance", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required.",
      });
    }

    // safer cache key
    const cacheKey = String(username);

    /* 1. Cache */
    const cached = getCached(cacheKey);

    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    /* 2. Deduplicate concurrent requests */
    if (inflight.has(cacheKey)) {
      try {
        const data = await inflight.get(cacheKey);

        res.setHeader("X-Cache", "INFLIGHT");

        return res.json(data);
      } catch (err) {
        return handleError(res, err);
      }
    }

    /* 3. Scrape */
    const scrapePromise = scrapeWithTimeout(
      username,
      password
    );

    inflight.set(cacheKey, scrapePromise);

    try {
      const data = await scrapePromise;

      setCached(cacheKey, data);

      res.setHeader("X-Cache", "MISS");

      return res.json(data);
    } catch (err) {
      console.error(
        "[attendance] final error:",
        err.code || err.message
      );

      return handleError(res, err);
    } finally {
      inflight.delete(cacheKey);
    }
  } catch (err) {
    console.error("[attendance] unexpected route error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

/* ─── Error Handler ─────────────────────────────────────────────────────── */
function handleError(res, error) {
  if (error.code === "USERNAME_INCORRECT") {
    return res.status(401).json({
      error: "Username is incorrect.",
    });
  }

  if (error.code === "PASSWORD_INCORRECT") {
    return res.status(401).json({
      error: "Password is incorrect.",
    });
  }

  if (error.code === "TIMEOUT") {
    return res.status(504).json({
      error:
        "ERP is taking too long. Try again in a few seconds.",
    });
  }

  if (error.code === "BLOCKED") {
    return res.status(503).json({
      error:
        "ERP temporarily blocked the request. Please retry.",
    });
  }

  return res.status(503).json({
    error:
      "ERP service unavailable. Please try again later.",
  });
}

module.exports = router;