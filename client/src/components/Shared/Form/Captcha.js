import React, { useState } from "react";
import "./Captcha.css";

const Captcha = ({ onVerify }) => {
  const [status, setStatus] = useState("idle"); // idle, loading, verified

  const handleClick = () => {
    if (status !== "idle") return;
    setStatus("loading");
    // Simulate loading for 1.5s then verify
    setTimeout(() => {
      setStatus("verified");
      if (onVerify) onVerify(true);
    }, 1500);
  };

  return (
    <div className="captcha-container" onClick={handleClick}>
      <div className="captcha-content">
        <div className="captcha-checkbox-wrapper">
          {status === "idle" && <div className="captcha-checkbox" />}
          {status === "loading" && <div className="captcha-spinner" />}
          {status === "verified" && (
            <div className="captcha-verified">
              <i className="fa-solid fa-check"></i>
            </div>
          )}
        </div>
        <div className="captcha-text">I'm not a robot</div>
      </div>
      <div className="captcha-logo">
        <img
          src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
          alt="reCAPTCHA"
        />
        <div className="captcha-links">
          <span>reCAPTCHA</span>
          <br />
          <a href="https://www.google.com/intl/en/policies/privacy/" target="_blank" rel="noreferrer">Privacy</a>
          {" - "}
          <a href="https://www.google.com/intl/en/policies/terms/" target="_blank" rel="noreferrer">Terms</a>
        </div>
      </div>
    </div>
  );
};

export default Captcha;
