import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import moment from "moment";
import { toast } from "react-toastify";

const ReceiverList = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const isOrganization = user?.role === "organization";
  const [data, setData] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch receiver data
  const getReceivers = async () => {
    try {
      if (isOrganization) {
        const { data } = await API.get("/inventory/get-organization-receiver-summary");
        if (data?.success) {
          setData(data?.receiverSummary || []);
        }
      } else {
        const { data } = await API.get("/admin/receiver-list");
        if (data?.success) {
          setData(data?.receiverData || []);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load receiver data");
      console.error(error);
    }
  };

  useEffect(() => {
    getReceivers();
  }, [isOrganization]);

  // Delete receiver record
  const handleDelete = async (id) => {
    if (!isAdmin) return;
    try {
      let answer = window.prompt(
        "Are you sure you want to delete this receiver?",
        "Sure"
      );
      if (!answer) return;
      const { data } = await API.delete(`/admin/delete-receiver/${id}`);
      toast.success(data?.message || "Receiver deleted");
      getReceivers(); // Refresh the list after deletion
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to delete receiver");
      console.error(error);
    }
  };

  const handleDownloadExcel = async () => {
    if (!isAdmin) return;
    if (!startDate || !endDate) {
      toast.error("Please select start date and end date");
      return;
    }

    try {
      const response = await API.get("/admin/receiver-export", {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receivers-data-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Unable to download receiver data");
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
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="m-0">Receiver Records</h2>
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
                    <th scope="col">Phone</th>
                    {isOrganization && <th scope="col">Donated (ML)</th>}
                    <th scope="col">Date</th>
                    {isAdmin && <th scope="col">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {data?.map((record) => (
                    <tr key={record._id || record.receiverId}>

                      <td>{record.name}</td>
                      <td>{record.email}</td>
                      <td>{record.phone}</td>
                      {isOrganization && <td>{record.totalDonatedML}</td>}
                      <td>{moment(record.createdAt || record.lastDonatedAt).format("DD/MM/YYYY")}</td>
                      {isAdmin && (
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            {record?.profileVerificationStatus === "pending" && (
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  window.location.href = "/verification-requests";
                                }}
                              >
                                View Profile
                              </button>
                            )}
                            {record?.profileVerificationStatus !== "pending" && (
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(record._id)}
                              >
                                Delete
                              </button>
                            )}
                            <button
                              className="btn btn-info text-white"
                              onClick={() => openDetailsModal(record)}
                            >
                              View
                            </button>
                          </div>
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
                <h5 className="modal-title">Receiver Details</h5>
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
                        !["__v", "password"].includes(key) &&
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
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (selectedRecord?._id) {
                      handleDelete(selectedRecord._id);
                    }
                    closeDetailsModal();
                  }}
                >
                  Delete
                </button>
                <button className="btn btn-secondary" onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ReceiverList;

