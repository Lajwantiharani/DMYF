import React from 'react';
import { BiDonateBlood, BiUserCircle } from "react-icons/bi";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from "react-toastify";

const Header = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout successful");
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="container-fluid">
          <div className="navbar-brand h1">
            <BiDonateBlood color="red" /> Blood Bank App
          </div>
          <button
            type="button"
            className="btn btn-outline-light sidebar-toggle-btn ms-auto"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
          <ul className="navbar-nav flex-row dashboard-header-nav">
            <li className="nav-item mx-3 welcome-item">
              <p className="nav-link">
                <BiUserCircle /> Welcome{" "}
                {user?.name || user?.hospitalName || user?.organizationName}
                &nbsp;
                <span className="badge bg-secondary">{user?.role}</span>
              </p>
            </li>

            <li className="nav-item mx-3 logout-item desktop-only-logout">
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
