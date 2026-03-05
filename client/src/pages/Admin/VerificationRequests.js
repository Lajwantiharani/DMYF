import React, { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";

const getUserDisplayName = (user) =>
  user?.name || user?.organizationName || user?.hospitalName || "-";

const VerificationRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updating, setUpdating] = useState(false);

  const getPendingUsers = async () => {
    try {
      const { data } = await API.get("/admin/pending-verification-users");
      if (data?.success) {
        setData(data?.users || []);
      } else {
        toast.error(data?.message || "Unable to load verification requests");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to load verification requests",
      );
    }
  };

  useEffect(() => {
    getPendingUsers();
  }, []);

  const handleDecision = async (action) => {
    if (!selectedUser?._id) return;
    setUpdating(true);
    try {
      const { data } = await API.put(`/admin/profile-verification/${selectedUser._id}`, {
        action,
      });
      if (data?.success) {
        toast.success(data?.message || "Verification status updated");
        setSelectedUser(null);
        getPendingUsers();
      } else {
        toast.error(data?.message || "Unable to update verification status");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to update verification status",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <Layout>
        <h4>Unauthorized</h4>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Verification Requests</h2>
      </div>

      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Requested At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.length ? (
              data.map((record) => (
                <tr key={record._id}>
                  <td>{getUserDisplayName(record)}</td>
                  <td>{record.role}</td>
                  <td>{record.email || "-"}</td>
                  <td>{record.phone || "-"}</td>
                  <td>
                    {record.profileVerificationRequestedAt
                      ? moment(record.profileVerificationRequestedAt).format(
                          "DD/MM/YYYY hh:mm A",
                        )
                      : "-"}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedUser(record)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No pending verification requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(15, 23, 42, 0.55)", zIndex: 2000 }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded p-4"
            style={{ width: "min(720px, 92vw)", maxHeight: "88vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-3">User Profile Details</h4>
            <div className="row g-2">
              <div className="col-6"><strong>Role:</strong> {selectedUser.role}</div>
              <div className="col-6"><strong>Name:</strong> {getUserDisplayName(selectedUser)}</div>
              <div className="col-6"><strong>Email:</strong> {selectedUser.email || "-"}</div>
              <div className="col-6"><strong>Phone:</strong> {selectedUser.phone || "-"}</div>
              <div className="col-6"><strong>City:</strong> {selectedUser.city || "-"}</div>
              <div className="col-6"><strong>Address:</strong> {selectedUser.address || "-"}</div>
              <div className="col-6"><strong>Blood Group:</strong> {selectedUser.bloodGroup || "-"}</div>
              <div className="col-6"><strong>Nukh:</strong> {selectedUser.nukh || "-"}</div>
              <div className="col-6"><strong>Akaah:</strong> {selectedUser.akaah || "-"}</div>
              <div className="col-6"><strong>Website:</strong> {selectedUser.website || "-"}</div>
              <div className="col-6"><strong>Email Verified:</strong> {selectedUser.isVerified ? "Yes" : "No"}</div>
              <div className="col-6">
                <strong>Requested At:</strong>{" "}
                {selectedUser.profileVerificationRequestedAt
                  ? moment(selectedUser.profileVerificationRequestedAt).format(
                      "DD/MM/YYYY hh:mm A",
                    )
                  : "-"}
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
                disabled={updating}
              >
                Close
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={() => handleDecision("not_verify")}
                disabled={updating}
              >
                Not Verify
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleDecision("verify")}
                disabled={updating}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VerificationRequests;
