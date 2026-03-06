import { useEffect, useState } from "react";

export default function Dashboard() {

  const [attendance, setAttendance] = useState([]);

  useEffect(() => {

    fetch("http://localhost:5000/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "160122771111",
        password: "160122771111"
      })
    })
      .then(res => res.json())
      .then(data => {
        setAttendance(data.attendance);
      });

  }, []);

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-5">
        Attendance
      </h1>

      <div className="overflow-x-auto">

        <table className="table table-zebra">

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

      </div>

    </div>
  );
}