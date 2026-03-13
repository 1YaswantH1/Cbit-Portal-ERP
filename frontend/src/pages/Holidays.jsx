import { useState } from "react";
import "../css/holidays.css";

const holidays = [
  { name: "Bhogi", date: "2026-01-14", day: "Wednesday" },
  { name: "Sankranti / Pongal", date: "2026-01-15", day: "Thursday" },
  { name: "Republic Day", date: "2026-01-26", day: "Monday" },
  { name: "Holi", date: "2026-03-03", day: "Tuesday" },
  { name: "Ugadi", date: "2026-03-19", day: "Thursday" },
  { name: "Eidul Fitr (Ramzan)", date: "2026-03-21", day: "Saturday" },
  { name: "Sri Rama Navami", date: "2026-03-27", day: "Friday" },
  { name: "Good Friday", date: "2026-04-03", day: "Friday" },
  { name: "Dr BR Ambedkar’s Birthday", date: "2026-04-14", day: "Tuesday" },
  { name: "Eidul Azha (Bakrid)", date: "2026-05-27", day: "Wednesday" },
  {
    name: "Shahadat Imam Hussain (R.A) 10th Moharam",
    date: "2026-06-26",
    day: "Friday",
  },
  { name: "Bonalu", date: "2026-08-10", day: "Monday" },
  { name: "Independence Day", date: "2026-08-15", day: "Saturday" },
  { name: "Eid Miladun Nabi", date: "2026-08-26", day: "Wednesday" },
  { name: "Sri Krishna Astami", date: "2026-09-04", day: "Friday" },
  { name: "Vinayaka Chavithi", date: "2026-09-14", day: "Monday" },
  { name: "Mahatma Gandhi Jayanthi", date: "2026-10-02", day: "Friday" },
  { name: "Vijaya Dasami", date: "2026-10-20", day: "Tuesday" },
  {
    name: "Following Day of Vijaya Dasami",
    date: "2026-10-21",
    day: "Wednesday",
  },
  {
    name: "Kartika Purnima / Guru Nanak’s Birthday",
    date: "2026-11-24",
    day: "Tuesday",
  },
  { name: "Christmas", date: "2026-12-25", day: "Friday" },
  { name: "Boxing Day", date: "2026-12-26", day: "Saturday" },
];

const sundayHolidays = [
  { name: "Maha Shivaratri", date: "2026-02-15", day: "Sunday" },
  { name: "Following Day of Ramzan", date: "2026-03-22", day: "Sunday" },
  { name: "Babu Jagjivan Ram’s Birthday", date: "2026-04-05", day: "Sunday" },
  { name: "Saddula Bathukamma", date: "2026-10-18", day: "Sunday" },
  { name: "Deepavali", date: "2026-11-08", day: "Sunday" },
];

function Holidays() {
  const [filter, setFilter] = useState("upcoming");
  const today = new Date();

  const upcoming = holidays.filter((h) => new Date(h.date) >= today);
  const completed = holidays.filter((h) => new Date(h.date) < today);
  const weekend = holidays.filter((h) => h.day === "Saturday");

  let displayData = [];

  if (filter === "upcoming") displayData = upcoming;
  if (filter === "completed") displayData = completed;
  if (filter === "weekend") displayData = [...weekend, ...sundayHolidays];

  return (
    <div className="holiday-page">
      <h2 className="holiday-heading">CBIT Holidays 2026</h2>

      <div className="holiday-buttons">
        <button onClick={() => setFilter("upcoming")}>Upcoming</button>
        <button onClick={() => setFilter("completed")}>Completed</button>
        <button onClick={() => setFilter("weekend")}>Weekend</button>
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

        <tbody>
          {displayData.map((h, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{h.name}</td>
              <td>{h.date}</td>
              <td>{h.day}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Holidays;
