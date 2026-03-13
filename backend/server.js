const express = require("express");
const cors = require("cors");

// const attendanceRoute = require("./routes/attendance");
const placementsRoute = require("./routes/placements");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/placements", placementsRoute);

// app.use("/attendance", attendanceRoute);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
