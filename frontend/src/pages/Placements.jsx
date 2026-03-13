import { useEffect, useState } from "react";
import "../css/placements.css";

function Placements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_CBIT_CIRCULAR_URL;

  useEffect(() => {
    fetch(`${API_URL}/placements`)
      .then((res) => res.json())
      .then((data) => {
        setPlacements(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="placements-container">
      <h2 className="placements-heading">CBIT Placement Circulars</h2>

      {loading ? (
        <p className="placements-loading">Loading placements...</p>
      ) : (
        <table className="placements-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Circular</th>
              <th>PDF</th>
            </tr>
          </thead>

          <tbody>
            {placements.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>

                <td>{item.title}</td>

                <td>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="placements-link"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Placements;
