import React from "react";
//import { userMenu } from "./Menus.js/userMenu";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "../../../../Styles/layout.css"; // Importing the CSS file

const Sidebar = () => {

  //set user state
  const {user} =useSelector(state=> state.auth)
  const location = useLocation();

  return (
    <div>
      <div className="sidebar">
        <div className="menu">
          {user?.role === "organization" && (
            <>
              <div
                className={`menu-item ${location.pathname === "/" && "active"}`}
              >
                <i className="fa-solid fa-warehouse"></i>
                <Link to="/">Inventory</Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/donor" && "active"
                }`}
              >
                <i className="fa-solid fa-hand-holding-dollar"></i>
                <Link to="/donor">Donor</Link>
              </div>
              <div
                className={`menu-item ${
                  location.pathname === "/hospital" && "active"
                }`}
              >
                <i className="fa-solid fa-hospital"></i>
                <Link to="/hospital">Hospital</Link>
              </div>
            </>
          )}
          {(user?.role === "donor "  || user?.role ==='hospital')  && (
            <div
              className={`menu-item ${
                location.pathname === "/organization" && "active"
              }`}
            >
              <i className="fa-solid fa-building-ngo"></i>
              <Link to="/organization">Organization</Link>
            </div>
          )}

          {/* {userMenu.map((menu) => {
            const isActive = location.pathname === menu.path;
            return (
              <div
                className={`menu-item ${isActive ? "active" : ""}`}
                key={menu.name}
              >
                <i className={menu.icon}></i>
                <Link to={menu.path}> {menu.name} </Link>
              </div>
            );
          })} */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
