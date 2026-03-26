import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";
import { setCurrentUser } from "../../redux/features/auth/authSlice";
import { isProfileComplete } from "../../utils/profileCompletion";

import CityAutocompleteInput from "../../components/Shared/CityAutocompleteInput";

const bloodGroups = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",

    website: "",
    city: "",
    address: "",
    bloodGroup: "",
    nukh: "",
    akaah: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const isAdmin = user?.role === "admin";
  const isProfileApproved = isAdmin || user?.profileVerificationStatus === "approved";
  const isVerifiedAndLocked = !isAdmin && (user?.profileVerificationStatus === "approved" || user?.profileVerificationStatus === "pending" || user?.profileVerificationStatus === "rejected");
  const canEditProfile = !isVerifiedAndLocked;
  const isVerificationPending = user?.profileVerificationStatus === "pending";
  const isVerificationRejected = user?.profileVerificationStatus === "rejected";
  const dateInputRef = useRef(null);
  const formatDateDisplay = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    // Check if value already has slashes (user saved date format)
    if (String(value).includes("/")) {
      return String(value);
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const parseDateFromInput = (value) => {
    if (!value) return null;
    const cleaned = String(value).replace(/\s+/g, "");
    const slashForm = cleaned.replace(/-/g, "/");
    const parts = slashForm.split("/").filter(Boolean).map(Number);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const d = new Date(year, month - 1, day);
      if (
        d.getFullYear() === year &&
        d.getMonth() === month - 1 &&
        d.getDate() === day
      ) {
        return d;
      }
    }
    return null;
  };
  
  // Format date input with auto-slashes as user types
  const handleDateInputChange = (e) => {
    if (!canEditProfile) return;
    let value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers
    
    // Add slashes automatically
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + "/" + value.slice(5);
    }
    
    // Limit to 10 characters (DD/MM/YYYY)
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setFormData((prev) => ({ ...prev, dob: value }));
  };
  const getAgeYears = (date) => {
    if (!date) return null;
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age -= 1;
    return age;
  };
  const profileComplete = isProfileComplete({
    ...user,
    name: formData.name,
    organizationName: user?.role === "organization" ? formData.name : user?.organizationName,
    email: formData.email,
    phone: formData.phone,

    website: formData.website,
    city: formData.city,
    address: formData.address,
    bloodGroup: formData.bloodGroup,
    nukh: formData.nukh,
    akaah: formData.akaah,
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user?.name || user?.organizationName || "",
        email: user?.email || "",
        phone: user?.phone || "",

        website: user?.website || "",
        city: user?.city || "",
        address: user?.address || "",
        bloodGroup: user?.bloodGroup || "",
        nukh: user?.nukh || "",
        akaah: user?.akaah || "",
        // Store the date as-is from the database (already formatted by backend or saved by user)
        dob: user?.dob || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    if (!canEditProfile) return;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isVerifiedAndLocked) {
      toast.info("Your verified profile is locked and cannot be changed.");
      return;
    }
    if (!isProfileApproved) return;
    const dobDate = parseDateFromInput(formData.dob);
    if (!dobDate) {
      toast.error("Please enter Date of Birth in Day / Month / Year format.");
      return;
    }
    // Append time to ensure local timezone is used, not UTC
    const dobWithTime = new Date(dobDate.getTime() - dobDate.getTimezoneOffset() * 60000);
    const age = getAgeYears(dobDate);
    const isMinor = age !== null && age < 18;
    setLoading(true);
    try {

      const payload = isAdmin
        ? { name: formData.name, email: formData.email }
        : { ...formData, dob: dobWithTime.toISOString() };

      const { data } = await API.put("/auth/update-profile", payload);
      if (data?.success) {
        dispatch(setCurrentUser(data.user));
        // Keep the date as user entered it (don't reformat)
        const savedUser = data.user;
        if (savedUser?.dob) {
          setFormData((prev) => ({
            ...prev,
            dob: savedUser.dob
          }));
        }
        toast.success(data?.message || "Profile updated successfully");
        if (!isAdmin && isMinor) {
          try {
            const verificationRes = await API.post("/auth/request-profile-verification");
            if (verificationRes?.data?.user) {
              dispatch(setCurrentUser(verificationRes.data.user));
            }
          } catch (err) {
            console.log("Auto verification request failed", err);
          }
        }
      } else {
        toast.error(data?.message || "Unable to save profile");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!profileComplete) {
      toast.error("Please complete all profile fields first");
      return;
    }
    const dobDate = parseDateFromInput(formData.dob);
    if (!dobDate) {
      toast.error("Please enter Date of Birth in Day / Month / Year format.");
      return;
    }

    setRequestingVerification(true);
    try {
      // Append time to ensure local timezone is used, not UTC
      const dobWithTime = new Date(dobDate.getTime() - dobDate.getTimezoneOffset() * 60000);
      const profileUpdateResponse = await API.put("/auth/update-profile", {
        ...formData,
        dob: dobWithTime.toISOString(),
      });
      if (profileUpdateResponse?.data?.success) {
        dispatch(setCurrentUser(profileUpdateResponse.data.user));
        // Keep the date as user entered it (don't reformat)
        const savedUser = profileUpdateResponse.data.user;
        if (savedUser?.dob) {
          setFormData((prev) => ({
            ...prev,
            dob: savedUser.dob
          }));
        }
      } else {
        toast.error(profileUpdateResponse?.data?.message || "Unable to save profile");
        return;
      }

      const { data } = await API.post("/auth/request-profile-verification");
      if (data?.success) {
        dispatch(setCurrentUser(data.user));
        toast.success(data?.message || "Verification request submitted successfully");
      } else {
        toast.error(data?.message || "Unable to submit verification request");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to submit verification request");
    } finally {
      setRequestingVerification(false);
    }
  };

  return (
    <Layout>
      <div className="container profile-page-container" style={{ maxWidth: "900px" }}>

        <h3 className="mb-3 profile-page-title page-heading">Profile</h3>
        <p className="profile-required-note mb-3">
        
        </p>
        <form onSubmit={handleSave} className="profile-form">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Name {canEditProfile && <span className="required-star">*</span>}</label>
              <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Email {canEditProfile && <span className="required-star">*</span>}</label>
              <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} disabled={!canEditProfile} required />
            </div>


            {!isAdmin && (
              <>
                {user?.role === "organization" && (
                  <div className="col-12 col-md-6">
                    <label className="form-label">Website</label>
                    <input
                      type="text"
                      className="form-control"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      disabled={!canEditProfile}
                      placeholder="e.g. https://example.com"
                    />
                  </div>
                )}

                <div className="col-12 col-md-6">
                  <label className="form-label">Phone Number {canEditProfile && <span className="required-star">*</span>}</label>
                  <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} disabled={!canEditProfile} required />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">
                    Date of Birth {canEditProfile && <span className="required-star">*</span>}
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      name="dob"
                      value={formData.dob}
                      onChange={handleDateInputChange}
                      onFocus={() => {
                        if (!canEditProfile) return;
                        dateInputRef.current?.showPicker?.();
                      }}
                      placeholder="DD/MM/YYYY"
                      disabled={!canEditProfile}
                      required
                      maxLength={10}
                    />
                    {canEditProfile && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary position-absolute top-0 end-0 h-100"
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onClick={() => {
                          if (!canEditProfile) return;
                          dateInputRef.current?.showPicker?.();
                        }}
                        tabIndex={-1}
                        aria-label="Open date picker"
                        disabled={!canEditProfile}
                      >
                        📅
                      </button>
                    )}
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{ pointerEvents: "none" }}
                      onChange={(e) => {
                        const iso = e.target.value;
                        const display = formatDateDisplay(iso);
                        setFormData((prev) => ({ ...prev, dob: display }));
                      }}
                      tabIndex={-1}
                      aria-hidden="true"
                      disabled={!canEditProfile}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">City {canEditProfile && <span className="required-star">*</span>}</label>
                  <CityAutocompleteInput
                    name="city"
                    value={formData.city}
                    onChange={(next) => {
                      if (!canEditProfile) return;
                      setFormData((prev) => ({ ...prev, city: next }));
                    }}
                    disabled={!canEditProfile}
                    required
                    placeholder="Start typing (e.g. La, hyd)"
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label">Address {canEditProfile && <span className="required-star">*</span>}</label>
                  <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} disabled={!canEditProfile} required />
                </div>

                {user?.role !== "organization" && (
                  <div className="col-12 col-md-6">
                    <label className="form-label">
                      Blood Group {canEditProfile && <span className="required-star">*</span>}
                    </label>
                    <select
                      className={canEditProfile ? "form-select" : "form-control"}
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      disabled={!canEditProfile}
                      required
                    >
                      {bloodGroups.map((group) => (
                        <option key={group || "none"} value={group}>
                          {group || "Select blood group"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {user?.role !== "organization" && (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Nukh {canEditProfile && <span className="required-star">*</span>}
                      </label>
                      <input type="text" className="form-control" name="nukh" value={formData.nukh} onChange={handleChange} disabled={!canEditProfile} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Akaah {canEditProfile && <span className="required-star">*</span>}
                      </label>
                      <input type="text" className="form-control" name="akaah" value={formData.akaah} onChange={handleChange} disabled={!canEditProfile} required />
                    </div>
                  </>
                )}
              </>
            )}

          </div>

          {/* Show status messages with consistent styling */}
          {!isAdmin && user?.profileVerificationStatus === "pending" && (
            <div className="text-center mt-4">
              <p className="text-danger mb-0 fw-semibold fs-5">
                Verification request submitted. Please wait for the admin approval.
              </p>
            </div>
          )}

          {!isAdmin && user?.profileVerificationStatus === "rejected" && (
            <div className="text-center mt-4">
              <p className="text-danger mb-0 fw-semibold fs-5">
                Your profile verification was rejected. Please contact admin for more information.
              </p>
            </div>
          )}

          {!isAdmin && user?.profileVerificationStatus === "approved" && (
            <div className="text-center mt-4">
              <p className="text-danger mb-0 fw-semibold fs-5">
                Profile is saved and can't be edited.
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="d-flex justify-content-end pe-2 mt-4 profile-save-wrap">
              <button type="submit" className="btn btn-danger px-4" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {!isAdmin && !isVerificationPending && !isVerificationRejected && user?.profileVerificationStatus !== "approved" && (
            <div className="d-flex justify-content-end pe-2 mt-4 profile-save-wrap">
              <button
                type="button"
                className="btn btn-danger px-4"
                onClick={handleRequestVerification}
                disabled={requestingVerification}
              >
                {requestingVerification ? "Submitting..." : "Request for Verification"}
              </button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
