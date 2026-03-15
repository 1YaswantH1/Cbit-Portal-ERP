import "./App.css";
import "animate.css";
import Navbar from "./components/Navbar";
import ClubsPage from "./pages/ClubsPages";
import Holidays from "./pages/Holidays";
import Placements from "./pages/Placements";
import Papers from "./pages/Papers";
import Attendance from "./pages/Attendance";
import Syllabus from "./pages/Syllabus";
import Footer from "./pages/Footer";

// import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/attendance" />} />
        <Route path="/holidays" element={<Holidays />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/placements" element={<Placements />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="*" element={<Navigate to="/attendance" />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
