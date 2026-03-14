import { useState } from "react";
import "../css/Attendance.css";

function Attendance() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [samePass, setSamePass] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState("");

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

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">CBIT Attendance</h2>

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

      {loading && (
        <p className="attendance-loading animate__animated animate__pulse animate__infinite">
          Fetching Attendance...
        </p>
      )}

      {studentName && <p className="attendance-student">{studentName}</p>}

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
    </div>
  );
}

export default Attendance;
