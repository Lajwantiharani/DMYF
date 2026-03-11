import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "../../../../Styles/layout.css";

const Sidebar = ({ onNavigate }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const canAccessOtherTabs =
    user?.role === "admin" || user?.profileVerificationStatus === "approved";
  const handleNavigate = () => {
    if (typeof onNavigate === "function") {
      onNavigate();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout successful");
    handleNavigate();
    navigate("/login");
  };

  const renderMenuItem = (path, label, icon, condition = true) => {
    if (!condition) return null;
    const isActive = location.pathname === path;
    const disabled = !canAccessOtherTabs && path !== "/profile";

    const onClick = (e) => {
      if (disabled) {
        e.preventDefault();
        toast.info("Please complete your profile first.");
        return;
      }
      handleNavigate();
    };

    return (
      <div
        className={`menu-item ${isActive ? "active" : ""} ${
          disabled ? "disabled" : ""
        }`}
      >
        <i className={icon}></i>
        <Link to={path} onClick={onClick} aria-disabled={disabled}>
          {label}
        </Link>
      </div>
    );
  };

  return (
    <div>
      <div className="sidebar">
        <div className="menu">
          {user &&
            renderMenuItem("/profile", "Profile", "fa-solid fa-user")}

          {renderMenuItem(
            "/inventory",
            "Inventory",
            "fa-solid fa-warehouse",
            user?.role === "organization" || user?.role === "donor"
          )}

          {renderMenuItem(
            "/blood-requests",
            "Blood Requests",
            "fa-solid fa-droplet",
            user?.role === "organization" || user?.role === "donor"
          )}

          {renderMenuItem(
            "/receiver-list",
            "Receiver List",
            "fa-solid fa-list",
            user?.role === "organization" || user?.role === "admin"
          )}

          {renderMenuItem(
            "/donor-list",
            "Donor List",
            "fa-solid fa-warehouse",
            user?.role === "admin"
          )}

          {renderMenuItem(
            "/org-list",
            "Organization List",
            "fa-solid fa-hospital",
            user?.role === "admin"
          )}

          {renderMenuItem(
            "/verification-requests",
            "Verification Requests",
            "fa-solid fa-circle-check",
            user?.role === "admin"
          )}

          {renderMenuItem(
            "/organization",
            "Organization",
            "fa-sharp fa-solid fa-building-ngo",
            user?.role === "hospital"
          )}

          {renderMenuItem(
            "/consumer",
            "Consumer",
            "fa-sharp fa-solid fa-building-ngo",
            user?.role === "hospital"
          )}

          {renderMenuItem(
            "/receiver",
            "Blood Request",
            "fa-solid fa-droplet",
            user?.role === "receiver"
          )}

          {renderMenuItem(
            "/donation",
            "Donated",
            "fa-sharp fa-solid fa-building-ngo",
            user && user?.role !== "receiver"
          )}

          {renderMenuItem(
            "/analytics",
            "Analytics",
            "fa-solid fa-chart-column",
            user?.role === "admin"
          )}

          {renderMenuItem(
            "/settings",
            "Settings",
            "fa-solid fa-gear",
            !!user
          )}

          {user && (
            <div className="menu-item mobile-only-logout">
              <i className="fa-solid fa-right-from-bracket"></i>
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
