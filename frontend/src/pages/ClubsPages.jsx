import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "../css/clubs.css";

function ClubsPage() {
  const [clubs, setClubs] = useState([]);

  useEffect(() => {
    fetch("/data/clubs.csv")
      .then((response) => response.text())
      .then((text) => {
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });

        setClubs(result.data);
      });
  }, []);

  return (
    <div className="clubs-container">
      {clubs.map((club, index) => (
        <div className="club-card" key={index}>
          <a
            href={club["mt-2 href"]}
            target="_blank"
            rel="noopener noreferrer"
            className="club-button"
          >
            <img
              src={club["w-full src"]}
              className="club-image"
              alt={club["text-lg"]}
            />
          </a>

          <h2 className="club-title">{club["text-lg"]}</h2>
        </div>
      ))}
    </div>
  );
}

export default ClubsPage;
