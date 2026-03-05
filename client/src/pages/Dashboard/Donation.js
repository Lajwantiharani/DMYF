import moment from "moment";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { toast } from "react-toastify";

const Donation = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // find donated records where blood was received by users
  const getDonatedRecords = async () => {
    try {
      const { data } = await API.get("/inventory/get-donated-records");
      if (data?.success) {
        setData(data?.donated || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getDonatedRecords();
  }, []);

  const handleDownloadExcel = async () => {
    if (!isAdmin) return;
    if (!startDate || !endDate) {
      toast.error("Please select start date and end date");
      return;
    }

    try {
      const response = await API.get("/admin/donated-export", {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `donated-data-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Unable to download donated data");
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h4 className="m-0">
            {user?.role === "organization" ? "Donated " : "Donated"}
          </h4>
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
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Donated By</th>
                <th scope="col">Role</th>
                <th scope="col">Receiver Name</th>
                <th scope="col">Receiver Email</th>
                <th scope="col">Blood Group</th>
                <th scope="col">Received (ML)</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((record) => (
                <tr key={record._id}>
                  <td>
                    {record?.organization?.organizationName ||
                      record?.organization?.name ||
                      record?.organization?.hospitalName ||
                      "-"}
                  </td>
                  <td>{record?.organization?.role || "-"}</td>
                  <td>
                    {record?.hospital?.name ||
                      record?.hospital?.hospitalName ||
                      record?.hospital?.organizationName ||
                      "-"}
                  </td>
                  <td>{record?.hospital?.email || record?.email || "-"}</td>
                  <td>{record.bloodGroup}</td>
                  <td>{record.quantity}</td>
                  <td>{moment(record.createdAt).format("DD/MM/YYYY")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Donation;
