process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const cors = require("cors");

// const attendanceRoute = require("./routes/attendance");
const placementsRoute = require("./routes/placements");
const papersRoute = require("./routes/papers");
const attendanceRoute = require("./routes/attendence");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", attendanceRoute);

app.use("/papers", papersRoute);
app.use("/placements", placementsRoute);

// app.use("/attendance", attendanceRoute);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
