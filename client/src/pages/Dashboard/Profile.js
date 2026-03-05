import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";
import { setCurrentUser } from "../../redux/features/auth/authSlice";
import { isProfileComplete } from "../../utils/profileCompletion";

const bloodGroups = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    bloodGroup: "",
    nukh: "",
    akaah: "",
  });
  const [loading, setLoading] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const isAdmin = user?.role === "admin";
  const isProfileApproved = isAdmin || user?.profileVerificationStatus === "approved";
  const isVerifiedAndLocked = !isAdmin && user?.profileVerificationStatus === "approved";
  const canEditProfile = !isVerifiedAndLocked;
  const isVerificationPending = user?.profileVerificationStatus === "pending";
  const profileComplete = isProfileComplete({
    ...user,
    name: formData.name,
    organizationName: user?.role === "organization" ? formData.name : user?.organizationName,
    hospitalName: user?.role === "hospital" ? formData.name : user?.hospitalName,
    email: formData.email,
    phone: formData.phone,
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
        name: user?.name || user?.organizationName || user?.hospitalName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || "",
        address: user?.address || "",
        bloodGroup: user?.bloodGroup || "",
        nukh: user?.nukh || "",
        akaah: user?.akaah || "",
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
    setLoading(true);
    try {
      const { data } = await API.put("/auth/update-profile", formData);
      if (data?.success) {
        dispatch(setCurrentUser(data.user));
        toast.success(data?.message || "Profile updated successfully");
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

    setRequestingVerification(true);
    try {
      const profileUpdateResponse = await API.put("/auth/update-profile", formData);
      if (profileUpdateResponse?.data?.success) {
        dispatch(setCurrentUser(profileUpdateResponse.data.user));
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
        <h3 className="mb-3 profile-page-title">Profile</h3>
        <p className="profile-required-note mb-3">
        
        </p>
        <form onSubmit={handleSave} className="profile-form">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Name <span className="required-star">*</span></label>
              <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Email <span className="required-star">*</span></label>
              <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Phone Number <span className="required-star">*</span></label>
              <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">City <span className="required-star">*</span></label>
              <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Address <span className="required-star">*</span></label>
              <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">
                Blood Group <span className="required-star">*</span>
              </label>
              <select className="form-select" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} disabled={!canEditProfile} required>
                {bloodGroups.map((group) => (
                  <option key={group || "none"} value={group}>
                    {group || "Select blood group"}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">
                Nukh <span className="required-star">*</span>
              </label>
              <input type="text" className="form-control" name="nukh" value={formData.nukh} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">
                Akaah <span className="required-star">*</span>
              </label>
              <input type="text" className="form-control" name="akaah" value={formData.akaah} onChange={handleChange} disabled={!canEditProfile} required />
            </div>

          </div>

          <div className="text-center mt-4 profile-save-wrap">
            {isVerifiedAndLocked ? (
              <button type="button" className="btn btn-secondary px-4" disabled>
                Profile Locked
              </button>
            ) : isProfileApproved ? (
              <button type="submit" className="btn btn-danger px-4" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={handleRequestVerification}
                disabled={requestingVerification || isVerificationPending}
              >
                {isVerificationPending
                  ? "Request Pending"
                  : requestingVerification
                    ? "Submitting..."
                    : "Request for Verification"}
              </button>
            )}
          </div>
          {!isAdmin && user?.profileVerificationStatus === "pending" && (
            <p className="text-warning mt-3 mb-0 fw-semibold">
              Verification request submitted. Please wait for admin approval.
            </p>
          )}
          {!isAdmin && user?.profileVerificationStatus === "rejected" && (
            <p className="text-danger mt-3 mb-0 fw-semibold">
              Your verification request was not approved. Update your profile and request again.
            </p>
          )}
          {!isAdmin && user?.profileVerificationStatus === "approved" && (
            <p className="text-success mt-3 mb-0 fw-semibold">
              Note: Profile is saved and can't be edited. To edit it contact admin.
            </p>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default Profile;
