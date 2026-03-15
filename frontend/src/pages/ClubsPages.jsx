import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import "../css/clubs.css";

function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

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

  const categories = [
    "All",
    ...Array.from(new Set(clubs.map((club) => club.category))).sort(),
  ];

  const toggleCategory = (category) => {
    if (category === "All") {
      setSelectedCategories([]);
      return;
    }

    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredClubs =
    selectedCategories.length === 0
      ? clubs
      : clubs.filter((club) => selectedCategories.includes(club.category));

  return (
    <div className="clubs-page">
      {/* <div className="clubs-header">
        <h1 className="clubs-main-title">If You're Not in a Club</h1>
        <h6 className="clubs-main-title">Join a Club</h6>
        <p className="clubs-sub-title">Find the One That Fits You.</p>
      </div> */}

      <div className="clubs-hero">
        <h1 className="meme-line">
          If You're Not In A <span>CLUB</span>,
        </h1>

        <h1 className="meme-line">
          Join A <span>CLUB</span>
        </h1>

        <p className="clubs-subtitle">Find the Club That Fits You.</p>
      </div>

      {/* FILTER BUTTON */}
      <div className="filter-header">
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filter by Category
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="club-filters">
          {categories.map((cat, index) => (
            <button
              key={index}
              className={`filter-btn ${
                selectedCategories.includes(cat) ? "active" : ""
              }`}
              onClick={() => toggleCategory(cat)}
            >
              {selectedCategories.includes(cat) && cat !== "All" ? "✓ " : ""}
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* CLUBS GRID */}
      <div className="clubs-container">
        {filteredClubs.map((club, index) => (
          <div className="club-card" key={index}>
            <a href={club.link} target="_blank" rel="noopener noreferrer">
              <img src={club.image} className="club-image" alt={club.name} />
            </a>

            <h2 className="club-title">{club.name}</h2>

            <a
              href={club.link}
              target="_blank"
              rel="noopener noreferrer"
              className="club-button"
            >
              Visit
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClubsPage;
