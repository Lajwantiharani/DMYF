import React from "react";
import { FaTimes } from "react-icons/fa";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const handleMenuItemClick = (path) => {
    // Prevent closing sidebar when navigating to Analytics
    if (isSidebarOpen && path !== "/analytics") {
      toggleSidebar();
    }
  };

  const renderMenuItem = (path, iconClass, label) => (
    <div className={`menu-item ${location.pathname === path ? "active" : ""}`}>
      <i className={iconClass}></i>
      <Link to={path} onClick={() => handleMenuItemClick(path)}>
        {label}
      </Link>
    </div>
  );

  return (
    <div className={`sidebar ${isSidebarOpen ? "active" : ""}`}>
      <div className="navbar-brand">Blood Bank App</div>
      <button className="close-icon" onClick={toggleSidebar}>
        <FaTimes />
      </button>
      <div className="menu">
        {user?.role === "organization" && (
          <>
            {renderMenuItem("/", "fa-solid fa-warehouse", "Inventory")}
            {renderMenuItem(
              "/donor",
              "fa-solid fa-hand-holding-medical",
              "Donor"
            )}
            {renderMenuItem(
              "/receiver-list",
              "fa-solid fa-warehouse",
              "Receiver List"
            )}
            {renderMenuItem(
              "/analytics",
              "fa-solid fa-chart-line",
              "Analytics"
            )}
          </>
        )}

        {user?.role === "admin" && (
          <>
            {renderMenuItem(
              "/donor-list",
              "fa-solid fa-warehouse",
              "Donor List"
            )}
            {renderMenuItem(
              "/receiver-list",
              "fa-solid fa-warehouse",
              "Receiver List"
            )}
            {renderMenuItem(
              "/org-list",
              "fa-solid fa-hospital",
              "Organization List"
            )}
            {renderMenuItem(
              "/analytics",
              "fa-solid fa-chart-line",
              "Analytics"
            )}
          </>
        )}

        {(user?.role === "donor" || user?.role === "hospital") &&
          renderMenuItem(
            "/organization",
            "fa-sharp fa-solid fa-building-ngo",
            "Organization"
          )}

        {user?.role === "hospital" && (
          <>
            {renderMenuItem(
              "/consumer",
              "fa-sharp fa-solid fa-building-ngo",
              "Consumer"
            )}
            {renderMenuItem(
              "/analytics",
              "fa-solid fa-chart-line",
              "Analytics"
            )}
          </>
        )}

        {user?.role === "donor" && (
          <>
            {renderMenuItem("/", "fa-solid fa-warehouse", "Inventory")}
            {renderMenuItem(
              "/receiver-list",
              "fa-solid fa-warehouse",
              "Receiver List"
            )}
            {renderMenuItem(
              "/donation",
              "fa-sharp fa-solid fa-building-ngo",
              "Donation"
            )}
            {renderMenuItem(
              "/analytics",
              "fa-solid fa-chart-line",
              "Analytics"
            )}
          </>
        )}

        {user?.role === "receiver" && (
          <>
            {renderMenuItem(
              "/donor-list",
              "fa-solid fa-warehouse",
              "Donor List"
            )}
            {renderMenuItem(
              "/org-list",
              "fa-solid fa-hospital",
              "Organization List"
            )}
            {renderMenuItem(
              "/analytics",
              "fa-solid fa-chart-line",
              "Analytics"
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
