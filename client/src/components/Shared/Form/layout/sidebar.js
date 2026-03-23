import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import "../../../../Styles/layout.css";

const Sidebar = ({ onNavigate }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const canAccessOtherTabs = user?.role === "admin" || user?.profileVerificationStatus === "approved";

  const allowedWhileLocked = new Set(["/profile", "/inquiry"]);
  
  const handleNavigate = () => {
    if (typeof onNavigate === "function") {
      onNavigate();
    }
  };

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logout successful");
    handleNavigate();
    navigate("/login");
  };

  const renderMenuItem = (path, label, icon, condition = true) => {
    if (!condition) return null;
    const isActive = location.pathname === path;
    const disabled = !canAccessOtherTabs && !allowedWhileLocked.has(path);
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
        className={`menu-item ${isActive ? "active" : ""} ${disabled ? "disabled" : ""}`}
      >
        <i className={icon}></i>
        <Link to={path} onClick={onClick} aria-disabled={disabled}>
          {label}
        </Link>
      </div>
    );
  };

  return (
    <div className="sidebar">
      <div className="menu">
        {user?.role === "admin"
          ? renderMenuItem("/admin", "Dashboard", "fa-solid fa-gauge-high")
          : user && renderMenuItem("/profile", "Profile", "fa-solid fa-user")}
        {renderMenuItem("/inventory", "Inventory", "fa-solid fa-warehouse", user?.role === "organization" || user?.role === "donor")}
        {renderMenuItem("/blood-requests", "Blood Requests", "fa-solid fa-droplet", user?.role === "organization" || user?.role === "donor")}
        {renderMenuItem("/receiver-list", "Receiver List", "fa-solid fa-list", user?.role === "organization" || user?.role === "admin")}
        {renderMenuItem("/donor-list", "Donor List", "fa-solid fa-warehouse", user?.role === "admin")}
        {renderMenuItem("/org-list", "Organization List", "fa-solid fa-hospital", user?.role === "admin")}
        {renderMenuItem("/verification-requests", "Verification Requests", "fa-solid fa-circle-check", user?.role === "admin")}
        {renderMenuItem("/receiver", "Blood Request", "fa-solid fa-droplet", user?.role === "receiver")}
        {renderMenuItem("/donation", "Donated", "fa-sharp fa-solid fa-building-ngo", user && user?.role !== "receiver")}
        {renderMenuItem("/analytics", "Analytics", "fa-solid fa-chart-column", user?.role === "admin")}
        {renderMenuItem("/user-inquiries", "User Inquiries", "fa-solid fa-envelope", user?.role === "admin")}
        {renderMenuItem("/inquiry", user?.role === "admin" ? "Inquiry" : "Technical Support", "fa-solid fa-envelope", user && user?.role !== "admin")}
        {renderMenuItem("/settings", "Settings", "fa-solid fa-gear", !!user)}
        {user && (
          <div className="menu-item" style={{ cursor: "pointer" }} onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
