import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Sidebar.css";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Function to handle menu item click and close the sidebar
  const handleMenuItemClick = () => {
    if (isSidebarOpen) {
      toggleSidebar(); // Close the sidebar when a menu item is clicked
    }
  };

  return (
    <div>
      <div className={`sidebar ${isSidebarOpen ? "active" : ""}`}>
        {/* Branding (Logo and App Name) */}
        <div className="navbar-brand d-md-block">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#ff0000" />
            <path d="M2 17L12 22L22 17" fill="#ff0000" />
            <path d="M2 12L12 17L22 12" fill="#ff0000" />
          </svg>
          Blood Bank App
        </div>

        {/* Close Icon Inside Sidebar */}
        <button className="close-icon" onClick={toggleSidebar}>
          <i className="fa fa-timesFa-times"></i>
        </button>

        <div className="menu">
          {user?.role === "organization" && (
            <>
              <div
                className={`menu-item ${location.pathname === "/" && "active"}`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/" onClick={handleMenuItemClick}>
                  Inventory
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/donor" && "active"
                }`}
              >
                <i className="fa-solid fa-hand-holding-medical"></i>
                <Link to="/donor" onClick={handleMenuItemClick}>
                  Donor
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/receiver-list" && "active"
                }`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/receiver-list" onClick={handleMenuItemClick}>
                  Receiver List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/analytics" && "active"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                <Link to="/analytics" onClick={handleMenuItemClick}>
                  Analytics
                </Link>
              </div>
            </>
          )}
          {user?.role === "admin" && (
            <>
              <div
                className={`menu-item ${
                  location.pathname === "/donor-list" && "active"
                }`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/donor-list" onClick={handleMenuItemClick}>
                  Donor List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/receiver-list" && "active"
                }`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/receiver-list" onClick={handleMenuItemClick}>
                  Receiver List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/org-list" && "active"
                }`}
              >
                <i className="fa-solid fa-hospital"></i>
                <Link to="/org-list" onClick={handleMenuItemClick}>
                  Organization List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/analytics" && "active"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                <Link to="/analytics" onClick={handleMenuItemClick}>
                  Analytics
                </Link>
              </div>
            </>
          )}
          {(user?.role === "donor" || user?.role === "hospital") && (
            <div
              className={`menu-item ${
                location.pathname === "/organization" && "active"
              }`}
            >
              <i className="fa-sharp fa-solid fa-building-ngo"></i>
              <Link to="/organization" onClick={handleMenuItemClick}>
                Organization
              </Link>
            </div>
          )}
          {user?.role === "hospital" && (
            <>
              <div
                className={`menu-item ${
                  location.pathname === "/consumer" && "active"
                }`}
              >
                <i className="fa-sharp fa-solid fa-building-ngo"></i>
                <Link to="/consumer" onClick={handleMenuItemClick}>
                  Consumer
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/analytics" && "active"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                <Link to="/analytics" onClick={handleMenuItemClick}>
                  Analytics
                </Link>
              </div>
            </>
          )}
          {user?.role === "donor" && (
            <>
              <div
                className={`menu-item ${location.pathname === "/" && "active"}`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/" onClick={handleMenuItemClick}>
                  Inventory
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/receiver-list" && "active"
                }`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/receiver-list" onClick={handleMenuItemClick}>
                  Receiver List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/donation" && "active"
                }`}
              >
                <i className="fa-sharp fa-solid fa-building-ngo"></i>
                <Link to="/donation" onClick={handleMenuItemClick}>
                  Donation
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/analytics" && "active"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                <Link to="/analytics" onClick={handleMenuItemClick}>
                  Analytics
                </Link>
              </div>
            </>
          )}
          {user?.role === "receiver" && (
            <>
              <div
                className={`menu-item ${
                  location.pathname === "/donor-list" && "active"
                }`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/donor-list" onClick={handleMenuItemClick}>
                  Donor List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/org-list" && "active"
                }`}
              >
                <i className="fa-solid fa-hospital"></i>
                <Link to="/org-list" onClick={handleMenuItemClick}>
                  Organization List
                </Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/analytics" && "active"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                <Link to="/analytics" onClick={handleMenuItemClick}>
                  Analytics
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
