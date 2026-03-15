import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../css/Footer.css";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

const CONTENT = {
  terms: {
    title: "Terms & Conditions",
    text: `This is an independent student-built tool created for CBIT students.

This application is not affiliated with or endorsed by Chaitanya Bharathi Institute of Technology (CBIT).

Data displayed here is sourced from publicly available CBIT platforms including the ERP portal, CBIT official website and CBIT library.

This tool is intended only for educational and convenience purposes.`,
  },
  privacy: {
    title: "Privacy Policy",
    text: `This application does not store, collect or share any personal data.

No login credentials or personal information are stored on this system.

All data displayed is retrieved from publicly available CBIT platforms such as the ERP portal, CBIT website and CBIT library.

This project is built purely for educational purposes for CBIT students.`,
  },
  disclaimer: {
    title: "Disclaimer",
    text: `This is an independent student-built project created for CBIT students.

Data accuracy depends on the official CBIT ERP portal and CBIT websites.

For official academic records or reports always refer to the official CBIT ERP portal.

Use this application at your own discretion.`,
  },
};

function Modal({ modalKey, onClose }) {
  const item = CONTENT[modalKey];

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!item) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal-box"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <center><h3>{item.title}</h3></center>
        <p className="modal-text">{item.text}</p>
        <center><button onClick={onClose}>Close</button></center>
      </div>
    </div>,
    document.body
  );
}

function Footer() {
  const [modal, setModal] = useState(null);

  return (
    <>
      <footer className="footer">
        {/* Developer */}
        <div className="footer-left">
          <h4>Developer</h4>
          <div className="dev">
            <span className="dev-name">Chinta Yaswanth Varma</span>
            <a
              href="https://www.linkedin.com/in/yaswanth-varma-chinta-a73100262/"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-btn"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                alt="LinkedIn"
              />
            </a>
          </div>
          <p className="footer-tagline">
            Modern problems require modern solutions.
            <br />
            Built for CBIT students.
          </p>
          <p className="footer-copy">
            © {new Date().getFullYear()} Cbit Portal{" "}
          </p>
        </div>

        {/* Contact */}
        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p className="contact-sub">Email Support</p>
          <a href="mailto:je5sstxte@mozmail.com" className="contact-mail">
            <MailOutlineIcon className="mail-icon" />
            je5sstxte@mozmail.com
          </a>
          <p className="contact-note">
            Have feedback or suggestions? Feel free to reach out.
          </p>
        </div>

        {/* Legal */}
        <div className="footer-right">
          <h4>Legal</h4>
          <span
            role="button"
            tabIndex={0}
            className="legal-btn"
            onClick={() => setModal("terms")}
          >
            Terms &amp; Conditions
          </span>
          <span
            role="button"
            tabIndex={0}
            className="legal-btn"
            onClick={() => setModal("privacy")}
          >
            Privacy Policy
          </span>
          <span
            role="button"
            tabIndex={0}
            className="legal-btn"
            onClick={() => setModal("disclaimer")}
          >
            Disclaimer
          </span>
        </div>
      </footer>

      {modal && <Modal modalKey={modal} onClose={() => setModal(null)} />}
    </>
  );
}

export default Footer;