import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "react-toastify";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";

const BloodRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const canManageRequests =
    user?.role === "donor" || user?.role === "organization";

  const getIncomingRequests = async () => {
    if (!canManageRequests) return;
    setLoading(true);
    try {
      const { data } = await API.get("/receiver/incoming-requests");
      if (data?.success) {
        setRequests(data.requests || []);
      } else {
        toast.error(data?.message || "Unable to fetch blood requests");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to fetch blood requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDecision = async (requestId, action) => {
    setActionLoadingId(requestId);
    try {
      const { data } = await API.put(
        `/receiver/incoming-requests/${requestId}/status`,
        { action },
      );
      if (data?.success) {
        toast.success(data?.message || "Status updated");
        setRequests((prev) =>
          prev.map((item) =>
            item._id === requestId
              ? { ...item, status: action === "accept" ? "accepted" : "rejected" }
              : item,
          ),
        );
      } else {
        toast.error(data?.message || "Unable to update status");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to update status");
    } finally {
      setActionLoadingId("");
    }
  };

  useEffect(() => {
    if (!canManageRequests) {
      navigate("/inventory");
      return;
    }
    getIncomingRequests();
  }, [canManageRequests, navigate]);

  return (
    <Layout>
      <div className="container mt-4">
        <h4 className="mb-3">Blood Requests</h4>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Receiver Name</th>
                <th scope="col">Receiver Contact / Email</th>
                <th scope="col">Blood Group</th>
                <th scope="col">Requested Quantity (ML)</th>
                <th scope="col">City</th>
                <th scope="col">Request Date</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const normalizedStatus =
                  request.status === "approved" ? "accepted" : request.status;

                return (
                  <tr key={request._id}>
                    <td>{request?.receiver?.name || "-"}</td>
                    <td>
                      {[request?.receiver?.phone, request?.receiver?.email]
                        .filter(Boolean)
                        .join(" / ") || "-"}
                    </td>
                    <td>{request.bloodGroup}</td>
                    <td>{request.quantity}</td>
                    <td>{request.city || "-"}</td>
                    <td>{moment(request.createdAt).format("DD/MM/YYYY")}</td>
                    <td className="text-capitalize">{normalizedStatus}</td>
                    <td>
                      {normalizedStatus === "pending" ? (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={actionLoadingId === request._id}
                            onClick={() => handleRequestDecision(request._id, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={actionLoadingId === request._id}
                            onClick={() => handleRequestDecision(request._id, "reject")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-muted">
                    No blood requests found.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="8" className="text-muted">
                    Loading requests...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default BloodRequests;
