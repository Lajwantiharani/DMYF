import React from 'react';
import logo from "../../../../pages/logo.png";
import "./header.css";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from "react-toastify";

const Header = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  // menuOpen should be a prop or local state. We'll use a prop for consistency with sidebar toggle.
  // If not passed, default to false.
  const menuOpen = typeof window !== "undefined" && window.menuOpen !== undefined ? window.menuOpen : false;

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid">
          <div className="navbar-brand h1">
            <img src={logo} alt="Logo" style={{ width: "45px", height: "auto", transform: "scale(3.5)", transformOrigin: "left center" }} />
          </div>
          <button
            type="button"
            className={`sidebar-toggle-btn ms-auto${menuOpen ? " open" : ""}`}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            style={{ color: menuOpen ? "#c1121f" : "#8f0f18", background: "transparent", border: "none", fontSize: "2rem" }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <ul className="navbar-nav flex-row dashboard-header-nav">
            <li className="nav-item mx-3 welcome-item" style={{ textAlign: "center" }}>
              <p className="nav-link mb-0" style={{ lineHeight: "1.3" }}>
                <span>Welcome {user?.name || user?.hospitalName || user?.organizationName}</span>
                <br />
                <span className="badge" style={{ backgroundColor: "#dc3545", color: "#fff" }}>
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
                </span>
              </p>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
