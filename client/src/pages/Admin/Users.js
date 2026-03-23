import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";

const TABS = [
  { key: "organizations", label: "Organization List" },
  { key: "donors", label: "Donor List" },
  { key: "receivers", label: "Receiver List" },
];

const Users = () => {
  const [activeTab, setActiveTab] = useState("organizations");
  const [data, setData] = useState({
    organizations: [],
    donors: [],
    receivers: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const [orgResponse, donorResponse, receiverResponse] = await Promise.all([
        API.get("/admin/org-list"),
        API.get("/admin/donor-list"),
        API.get("/admin/receiver-list"),
      ]);

      setData({
        organizations: orgResponse?.data?.orgData || [],
        donors: donorResponse?.data?.donorData || [],
        receivers: receiverResponse?.data?.receiverData || [],
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load users data");
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUsersData();
  }, [getUsersData]);

  const getRows = () => data[activeTab] || [];

  const handleDelete = async (record) => {
    if (!record?._id) return;

    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      const endpoint =
        activeTab === "receivers"
          ? `/admin/delete-receiver/${record._id}`
          : `/admin/delete-donor/${record._id}`;

      const { data: response } = await API.delete(endpoint);
      toast.success(response?.message || "User deleted successfully");
      setData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((item) => item._id !== record._id),
      }));
      setSelectedRecord(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete user");
      console.log(error);
    }
  };

  const formatLabel = (key) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase());

  const formatValue = (key, value) => {
    if (key.toLowerCase().includes("date") || key.endsWith("At")) {
      const date = moment(value);
      if (date.isValid()) return date.format("DD/MM/YYYY hh:mm A");
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderName = (record) => record?.organizationName || record?.name || "-";

  const handleDownloadExcel = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start date and end date");
      return;
    }

    const exportMap = {
      organizations: {
        endpoint: "/admin/org-export",
        filename: `organizations-data-${startDate}-to-${endDate}.xlsx`,
      },
      donors: {
        endpoint: "/admin/donor-export",
        filename: `donors-data-${startDate}-to-${endDate}.xlsx`,
      },
      receivers: {
        endpoint: "/admin/receiver-export",
        filename: `receivers-data-${startDate}-to-${endDate}.xlsx`,
      },
    };

    const currentExport = exportMap[activeTab];
    if (!currentExport) return;

    try {
      const response = await API.get(currentExport.endpoint, {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = currentExport.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download Excel data");
      console.log(error);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h2 className="m-0 page-heading">Users</h2>
          <div className="d-flex justify-content-end align-items-end gap-2 flex-wrap">
            <div>
              <label className="form-label mb-1">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label mb-1">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="btn btn-success" onClick={handleDownloadExcel}>
              Download Excel Data
            </button>
          </div>
        </div>

        <ul className="nav nav-tabs mb-3 receiver-tabs">
          {TABS.map((tab) => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                className={`nav-link receiver-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center">Loading...</td>
                </tr>
              ) : getRows().length ? (
                getRows().map((record) => (
                  <tr key={record._id}>
                    <td>{renderName(record)}</td>
                    <td>{record.email || "-"}</td>
                    <td>{record.phone || "-"}</td>
                    <td>{record.role || "-"}</td>
                    <td>{record.profileVerificationStatus || "-"}</td>
                    <td>{record.createdAt ? moment(record.createdAt).format("DD/MM/YYYY") : "-"}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {record.profileVerificationStatus === "pending" && (
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              window.location.href = "/verification-requests";
                            }}
                          >
                            View Profile
                          </button>
                        )}
                        <button
                          className="btn btn-info text-white"
                          onClick={() => setSelectedRecord(record)}
                        >
                          View
                        </button>
                        {record.profileVerificationStatus !== "pending" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(record)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRecord(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {Object.entries(selectedRecord)
                    .filter(
                      ([key, value]) =>
                        !["_id", "__v", "password", "otp", "otpExpires"].includes(key) &&
                        value !== undefined &&
                        value !== null &&
                        value !== "",
                    )
                    .map(([key, value]) => (
                      <div className="col-12 col-md-6 mb-2" key={key}>
                        <strong>{formatLabel(key)}:</strong>{" "}
                        {formatValue(key, value)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;
