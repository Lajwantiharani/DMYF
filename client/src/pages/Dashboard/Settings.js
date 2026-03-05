import React, { useState } from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";

const Settings = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.put("/auth/update-profile", formData);
      if (data?.success) {
        toast.success(data?.message || "Password updated successfully");
        setFormData({ newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data?.message || "Unable to update password");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4" style={{ maxWidth: "700px" }}>
        <h3 className="mb-3">Settings</h3>
        <form onSubmit={handleSave}>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-danger px-4" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Settings;
