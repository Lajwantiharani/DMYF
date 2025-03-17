import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import Donate1 from "./Donate_1.png";
import logo from "./logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF } from "@fortawesome/free-brands-svg-icons";

const LandingPage = () => {
  return (
    <>
      <div className="navbar-container">
        <div className="logo">
          <img src={logo} alt="Logo" />
          <span className="logo-text">DHAT Blood Bank</span>
        </div>
      </div>

      {/* Donate Section */}
      <div>
        <div
          className="donate-section"
          style={{ textAlign: "center", margin: "auto" }}
        >
          <div className="donate-text">
            <h3>Welcome to DHAT Blood Bank</h3>
            <h1>Be a hero in someone’s story - donate blood today.</h1>
            <p style={{ textAlign: "justify" }}>
              Did you know that every two seconds, someone needs blood?
              Surprisingly, only 3% of eligible people donate. Your donation
              helps in emergencies, surgeries, and treatments for illnesses like
              cancer. Imagine, a single car crash victim might need 100 units of
              blood! Join the movement – over 117 million people donate each
              year, making a huge impact. Your simple act can be a lifeline for
              someone in need. Give the gift of life – be a blood donor and make
              a difference!
            </p>
            {/* Register Now Link Inside Donate Section */}
            <div className="register-link-container">
              <Link to="/register" id="donate-button" className="action-link">
                Register
              </Link>
            </div>
          </div>
          <div className="donate-image">
            <img src={Donate1} alt="Donate Blood, Save Lives" />
          </div>
        </div>

        {/* Mission Section */}
        <div
          className="mission"
          style={{ textAlign: "center", margin: "auto" }}
        >
          <div className="mission-text">
            <h1>
              <span id="black-text">Our</span>{" "}
              <span id="red-text">Mission</span>
            </h1>
            <p style={{ textAlign: "justify" }}>
              Saving Lives, Building Hope: Maheshwari Blood Bank is a heartbeat
              of compassion, where every drop of donated blood is a lifeline.
              Join us in this journey of giving, uniting our community in the
              warmth of shared humanity. Together, we are the heartbeat of hope.
            </p>
          </div>
        </div>

        {/* Blood Type Section */}
        <div className="blood-type-heading">
          <h1>Compatible Blood Type Donors</h1>
        </div>

        <div className="blood-type">
          <table id="table">
            <thead>
              <tr>
                <th>Blood Type</th>
                <th>Donate Blood To</th>
                <th>Receive Blood From</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>A+</td>
                <td>A+, AB+</td>
                <td>A+, A-, O+, O-</td>
              </tr>
              <tr>
                <td>B+</td>
                <td>B+, AB+</td>
                <td>B+, B-, O+, O-</td>
              </tr>
              <tr>
                <td>O+</td>
                <td>O+, A+, B+, AB+</td>
                <td>O+, O-</td>
              </tr>
              <tr>
                <td>AB+</td>
                <td>AB+</td>
                <td>Everyone</td>
              </tr>
              <tr>
                <td>A-</td>
                <td>A+, A-, AB+, AB-</td>
                <td>A-, O-</td>
              </tr>
              <tr>
                <td>B-</td>
                <td>B+, B-, AB+, AB-</td>
                <td>B-, O-</td>
              </tr>
              <tr>
                <td>O-</td>
                <td>Everyone</td>
                <td>O-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="logo">
          <img src={logo} alt="Logo" />
          <span id="logo-text">DMYF</span>
        </div>
        <div className="facebook-info">
          <a href="https://www.facebook.com/Pak.DMYF" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faFacebookF} className="facebook-icon" />
          </a>
          Follow us on Facebook for updates!
        </div>
      </div>
    </>
  );
};

export default LandingPage;