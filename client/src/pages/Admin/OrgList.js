import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";
const OrgList = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const isReceiver = user?.role === "receiver";
  const [data, setData] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  //find donar records
  const getDonors = useCallback(async () => {
    try {
      if (isReceiver) {
        const { data } = await API.get("/inventory/get-organization-available-stock");
        if (data?.success) {
          setData(data?.stock || []);
        }
      } else {
        const { data } = await API.get("/admin/org-list");
        if (data?.success) {
          setData(data?.orgData || []);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load organization data");
      console.log(error);
    }
  }, [isReceiver]);

  useEffect(() => {
    getDonors();
  }, [getDonors]);

  const handleReceiveFromOrganization = async (record) => {
    if (!isReceiver) return;
    try {
      const bloodGroup = (record?.bloodGroup || "").toUpperCase();
      const allowedGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
      if (!allowedGroups.includes(bloodGroup)) {
        toast.error("Invalid blood group");
        return;
      }

      const quantity = window.prompt("Enter quantity (ML) to receive", "100");
      if (!quantity) return;
      const qty = Number(quantity);
      if (!qty || qty <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      const { data } = await API.post("/inventory/create-inventory", {
        email: record.email,
        inventoryType: "in",
        bloodGroup,
        quantity: qty,
      });

      if (data?.success) {
        toast.success(data?.message || "Blood received successfully");
        getDonors();
      } else {
        toast.error(data?.message || "Unable to receive blood");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to receive blood");
      console.log(error);
    }
  };

  const handleDownloadExcel = async () => {
    if (!isAdmin) return;
    if (!startDate || !endDate) {
      toast.error("Please select start date and end date");
      return;
    }

    try {
      const response = await API.get("/admin/org-export", {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `organizations-data-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to download organization data");
    }
  };

  const openDetailsModal = (record) => {
    setSelectedRecord(record);
  };

  const closeDetailsModal = () => {
    setSelectedRecord(null);
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

  return (
    <Layout>

      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h2 className="m-0 page-heading">Organization Records</h2>
          {isAdmin && (
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
          )}
        </div>
        <div className="table-responsive">
          <table className="table ">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              {!isReceiver && <th scope="col">Phone</th>}
              {isReceiver && <th scope="col">Blood Group</th>}
              {isReceiver && <th scope="col">Available (ML)</th>}
              <th scope="col">Date</th>
              {(isAdmin || isReceiver) && <th scope="col">Action</th>}
            </tr>
          </thead>
          <tbody>
            {data?.map((record) => (
              <tr key={record._id || `${record.organization}-${record.bloodGroup}`}>
                <td>{record.organizationName}</td>
                <td>{record.email}</td>
                {!isReceiver && <td>{record.phone}</td>}
                {isReceiver && <td>{record.bloodGroup}</td>}
                {isReceiver && <td>{record.availableQuantity}</td>}
                <td>{moment(record.createdAt || record.lastUpdated).format("DD/MM/YYYY")}</td>
                {isAdmin && (
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      {record?.profileVerificationStatus === "pending" && (
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            window.location.href = "/verification-requests";
                          }}
                        >
                          View Profile
                        </button>
                      )}
                      {record?.profileVerificationStatus !== "pending" && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setDeleteId(record._id);
                            setShowDeleteModal(true);
                          }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => openDetailsModal(record)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                )}
                {isReceiver && (
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReceiveFromOrganization(record)}
                    >
                      Receive
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>

          </table>
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
                  <h5 className="modal-title">Organization Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDetailsModal}
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
                          value !== ""
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
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(15, 23, 42, 0.55)", zIndex: 2000 }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded p-4"
            style={{ width: "min(400px, 92vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Confirm Delete</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <p className="mb-4">Are you sure you want to delete this organization?</p>
            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (deleteId) {
                    try {
                      const { data } = await API.delete(`/admin/delete-donor/${deleteId}`);
                      toast.success(data?.message || "Organization deleted");
                      setData((prev) => prev.filter((item) => item._id !== deleteId));
                    } catch (error) {
                      toast.error(error?.response?.data?.message || "Unable to delete organization");
                    }
                  }
                  setShowDeleteModal(false);
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrgList;
