import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ThemeController from "./ThemeController";

function Navbar() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="navbar bg-base-100 px-10 border-b">
      {/* Logo -> Home */}
      <div className="navbar-start">
        <Link to="/" className="text-2xl font-bold">
          ERP-CBIT
        </Link>
      </div>

      {/* Menu */}
      <div className="navbar-center lg:flex">
        <ul className="menu menu-horizontal gap-4 font-medium">
          <li>
            <Link to="/attendance">Attendance Analyzer</Link>
          </li>

          <li>
            <Link to="/holidays">Holidays</Link>
          </li>

          {/* Clubs Dropdown */}
          <li>
            <details>
              <summary>Clubs</summary>
              <ul className="p-2 bg-base-100 rounded-box w-48">
                <li>
                  <Link to="/clubs">Clubs</Link>
                </li>
                <li>
                  <Link to="/recruitment">Club Recruitment</Link>
                </li>
              </ul>
            </details>
          </li>

          <li>
            <Link to="/support">Support</Link>
          </li>

          <li>
            <Link to="/about">About</Link>
          </li>
        </ul>
      </div>

      {/* Right Section */}
      <div className="navbar-end gap-3">
        <ThemeController theme={theme} toggleTheme={toggleTheme} />
      </div>
    </div>
  );
}

export default Navbar;
