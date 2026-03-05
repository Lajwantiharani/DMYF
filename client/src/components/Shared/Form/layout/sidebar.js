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

  return (
    <div>
      <div className="sidebar">
        <div className="menu">
          {user && (
            <div className={`menu-item ${location.pathname === "/profile" && "active"}`}>
              <i className="fa-solid fa-user"></i>
              <Link to="/profile" onClick={handleNavigate}>Profile</Link>
            </div>
          )}

          {canAccessOtherTabs && (
            <>
          {user?.role === "organization" && (
            <>
              <div className={`menu-item ${location.pathname === "/inventory" && "active"}`}>
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/inventory" onClick={handleNavigate}>Inventory</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/blood-requests" && "active"}`}>
                <i className="fa-solid fa-droplet"></i>
                <Link to="/blood-requests" onClick={handleNavigate}>Blood Requests</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/receiver-list" && "active"}`}>
                <i className="fa-solid fa-list"></i>
                <Link to="/receiver-list" onClick={handleNavigate}>Receiver List</Link>
              </div>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <div className={`menu-item ${location.pathname === "/donor-list" && "active"}`}>
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/donor-list" onClick={handleNavigate}>Donor List</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/receiver-list" && "active"}`}>
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/receiver-list" onClick={handleNavigate}>Receiver List</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/org-list" && "active"}`}>
                <i className="fa-solid fa-hospital"></i>
                <Link to="/org-list" onClick={handleNavigate}>Organization List</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/verification-requests" && "active"}`}>
                <i className="fa-solid fa-circle-check"></i>
                <Link to="/verification-requests" onClick={handleNavigate}>Verification Requests</Link>
              </div>
            </>
          )}

          {user?.role === "hospital" && (
            <div className={`menu-item ${location.pathname === "/organization" && "active"}`}>
              <i className="fa-sharp fa-solid fa-building-ngo"></i>
              <Link to="/organization" onClick={handleNavigate}>Organization</Link>
            </div>
          )}

          {user?.role === "hospital" && (
            <div className={`menu-item ${location.pathname === "/consumer" && "active"}`}>
              <i className="fa-sharp fa-solid fa-building-ngo"></i>
              <Link to="/consumer" onClick={handleNavigate}>Consumer</Link>
            </div>
          )}

          {user?.role === "donor" && (
            <>
              <div className={`menu-item ${location.pathname === "/inventory" && "active"}`}>
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/inventory" onClick={handleNavigate}>Inventory</Link>
              </div>
              <div className={`menu-item ${location.pathname === "/blood-requests" && "active"}`}>
                <i className="fa-solid fa-droplet"></i>
                <Link to="/blood-requests" onClick={handleNavigate}>Blood Requests</Link>
              </div>
            </>
          )}

          {user?.role === "receiver" && (
            <>
              <div className={`menu-item ${location.pathname === "/receiver" && "active"}`}>
                <i className="fa-solid fa-droplet"></i>
                <Link to="/receiver" onClick={handleNavigate}>Blood Request</Link>
              </div>
            </>
          )}

          {user && user?.role !== "receiver" && (
            <div className={`menu-item ${location.pathname === "/donation" && "active"}`}>
              <i className="fa-sharp fa-solid fa-building-ngo"></i>
              <Link to="/donation" onClick={handleNavigate}>Donated</Link>
            </div>
          )}

          {user?.role === "admin" && (
            <div className={`menu-item ${location.pathname === "/analytics" && "active"}`}>
              <i className="fa-solid fa-chart-column"></i>
              <Link to="/analytics" onClick={handleNavigate}>Analytics</Link>
            </div>
          )}

          {user && (
            <div className={`menu-item ${location.pathname === "/settings" && "active"}`}>
              <i className="fa-solid fa-gear"></i>
              <Link to="/settings" onClick={handleNavigate}>Settings</Link>
            </div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
