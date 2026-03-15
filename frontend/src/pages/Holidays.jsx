import { useState, useEffect } from "react";
import Papa from "papaparse";
import "../css/holidays.css";

function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [filter, setFilter] = useState("upcoming");

  const today = new Date();

  useEffect(() => {
    fetch("/data/holiday.csv")
      .then((res) => res.text())
      .then((text) => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        setHolidays(result.data);
      });
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const upcoming = holidays
    .filter((h) => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const completed = holidays
    .filter((h) => new Date(h.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const weekend = holidays
    .filter((h) => h.type === "weekend")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let displayData = [];

  if (filter === "upcoming") displayData = upcoming;
  if (filter === "completed") displayData = completed;
  if (filter === "weekend") displayData = weekend;

  return (
    <div className="holiday-page">
      <h2 className="holiday-heading">CBIT Holidays 2026</h2>

      <div className="holiday-buttons">
        <button
          className={filter === "upcoming" ? "active" : ""}
          onClick={() => setFilter("upcoming")}
        >
          Upcoming
        </button>

        <button
          className={filter === "completed" ? "active" : ""}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>

        <button
          className={filter === "weekend" ? "active" : ""}
          onClick={() => setFilter("weekend")}
        >
          Weekend
        </button>
      </div>

      <table className="holiday-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Occasion / Festival</th>
            <th>Date</th>
            <th>Day</th>
          </tr>
        </thead>

        <tbody key={filter}>
          {displayData.map((h, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{h.name}</td>
              <td>{formatDate(h.date)}</td>
              <td>{h.day}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Holidays;
