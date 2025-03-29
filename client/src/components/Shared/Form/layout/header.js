// Header.jsx
import React from "react";
import { BiDonateBlood, BiUserCircle } from "react-icons/bi";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Sidebar.css";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    alert("Logout successfully");
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid">
          <div className="navbar-brand h1 d-md-block">
            <BiDonateBlood color="red" /> Blood Bank App
          </div>
          {/* Hamburger button for mobile */}
          <button className="hamburger d-md-none" onClick={toggleSidebar}>
            <i className={`fas ${isSidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          </button>
          <ul className="navbar-nav flex-row">
            <li className="nav-item mx-3 d-flex align-items-center">
              <p className="nav-link mb-0">
               Welcome{" "}
                {user?.name || user?.hospitalName || user?.organizationName} 
                <span className="badge bg-secondary">{user?.role}</span>
              </p>
              <button
                className="btn btn-danger ms-3"
                onClick={handleLogout}
                style={{ marginLeft: "10px" }}
              >
                Logout
              </button>
            </li>
            {location.pathname !== "/" &&
              location.pathname !== "/donor" &&
              location.pathname !== "/hospital" &&
              location.pathname !== "/admin" &&
              location.pathname !== "/receiver" && (
                <li className="nav-item mx-3">
                  <Link to="/" className="nav-link">
                    Home
                  </Link>
                </li>
              )}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
