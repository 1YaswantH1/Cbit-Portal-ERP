import { useState } from "react";
import "../css/attendance.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function Attendance() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [samePass, setSamePass] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalPassword = samePass ? username : password;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password: finalPassword,
        }),
      });

      const data = await res.json();

      setStudentName(data.studentName);
      setAttendance(data.attendance);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  /*
  ===============================
  INSIGHT CALCULATIONS
  ===============================
  */

  const subjects = attendance.slice(0, -1); // remove total row

  const processed = subjects.map((row) => {
    const subject = row[1];
    const held = Number(row[3]);
    const attended = Number(row[4]);
    const percent = Number(row[5]);

    const target = 0.75;

    let classesNeeded = 0;

    if (attended / held < target) {
      classesNeeded = Math.ceil((target * held - attended) / (1 - target));
    }

    const safeBunks = Math.max(Math.floor(attended / target - held), 0);

    return {
      subject,
      held,
      attended,
      percent,
      classesNeeded,
      safeBunks,
    };
  });

  /*
  ===============================
  GRAPH DATA
  ===============================
  */

  const chartData = {
    labels: processed.map((s) => s.subject),

    datasets: [
      {
        label: "Attendance %",
        data: processed.map((s) => s.percent),
        backgroundColor: "#003049",
      },
      {
        label: "Target (75%)",
        data: processed.map(() => 75),
        backgroundColor: "#e63946",
      },
    ],
  };

  /*
  ===============================
  OVERALL INSIGHT
  ===============================
  */

  const totalRow = attendance[attendance.length - 1];

  let overall = null;

  if (totalRow) {
    const held = Number(totalRow[3]);
    const attended = Number(totalRow[4]);

    overall = ((attended / held) * 100).toFixed(2);
  }

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">CBIT Attendance</h2>

      {/* LOGIN FORM */}

      <form className="attendance-form" onSubmit={handleSubmit}>
        <div className="attendance-search-row">
          <input
            className="attendance-input"
            type="text"
            placeholder="Enter ERP Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <button className="attendance-button" type="submit">
            Search
          </button>
        </div>

        <label className="attendance-checkbox">
          <input
            type="checkbox"
            checked={samePass}
            onChange={() => setSamePass(!samePass)}
          />
          Username = Password
        </label>

        {!samePass && (
          <input
            className="attendance-input"
            type="password"
            placeholder="ERP Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
      </form>

      {loading && <p className="attendance-loading">Fetching Attendance...</p>}

      {studentName && <p className="attendance-student">{studentName}</p>}

      {/* GRAPH */}

      {processed.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3>Attendance Overview</h3>

          <Bar data={chartData} />
        </div>
      )}

      {/* INSIGHT TABLE */}

      {processed.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3>Attendance Strategy</h3>

          <table className="attendance-table">
            <thead>
              <tr>
                <td>Subject</td>
                <td>Current %</td>
                <td>Classes Needed (75%)</td>
                <td>Safe Bunks</td>
              </tr>
            </thead>

            <tbody>
              {processed.map((row, i) => (
                <tr key={i}>
                  <td>{row.subject}</td>

                  <td>{row.percent}%</td>

                  <td>{row.classesNeeded}</td>

                  <td>{row.safeBunks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ORIGINAL ERP TABLE */}

      {attendance.length > 0 && (
        <table className="attendance-table">
          <tbody>
            {attendance.map((row, i) => (
              <tr key={i}>
                {row.map((col, j) => (
                  <td key={j}>{col}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* OVERALL INSIGHT */}

      {overall && (
        <p
          style={{
            marginTop: "25px",
            textAlign: "center",
            fontWeight: "600",
          }}
        >
          Overall Attendance : {overall}%
        </p>
      )}
    </div>
  );
}

export default Attendance;
