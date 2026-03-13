import { useEffect, useState } from "react";
import "../css/placements.css";

function Placements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const API_URL = import.meta.env.VITE_API_URL;

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

  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;

  const currentPlacements = placements.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(placements.length / rowsPerPage);

  return (
    <div className="placements-container">
      <h2 className="placements-heading">CBIT Placement Circulars</h2>

      {loading ? (
        <p className="placements-loading">Loading placements...</p>
      ) : (
        <>
          <table className="placements-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Circular</th>
                <th>PDF</th>
              </tr>
            </thead>

            <tbody>
              {currentPlacements.map((item, index) => (
                <tr key={index}>
                  <td>{indexOfFirst + index + 1}</td>

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

          {/* PAGINATION */}

          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Prev
            </button>

            <span>
              Page {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Placements;
