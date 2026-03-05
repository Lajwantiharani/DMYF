import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Shared/Form/Spinner";
import Layout from "../components/Shared/Form/layout/layout";
import Modal from "../components/Shared/Form/modal/Modal";
import API from "../services/API";
import moment from "moment";
import { toast } from "react-toastify";

const HomePage = () => {
  const { loading, error,user } = useSelector((state) => state.auth); // Redux state for loading and error
  const [data, setData] = useState([]); // State for inventory data
  const [fetchError, setFetchError] = useState(null); // State for fetch errors
const navigate = useNavigate()

  const getBloodRecords = async () => {
    try {
      const response = await API.get("/inventory/get-inventory");
      if (response.data?.success) {
        setData(response.data.inventory);
        setFetchError(null); // Clear previous fetch errors
      } else {
        setFetchError("Failed to fetch inventory records.");
      }
    } catch (err) {
      console.error("API fetch error:", err);
      setFetchError("An error occurred while fetching data.");
    }
  };

  useEffect(() => {
    getBloodRecords();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/analytics");
    }
    if (user?.role === "receiver") {
      navigate("/receiver");
    }
  }, [navigate, user?.role]);

  return (
    <Layout>
      {fetchError && <div className="alert alert-danger">{fetchError}</div>}

      {/* Loading State */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="container">
            <h4
              className="ms-4"
              data-bs-toggle="modal"
              data-bs-target="#staticBackdrop"
              style={{ cursor: "pointer" }}
            >
              <i className="fa-solid fa-plus text-success py-4"></i> Add
              Inventory
            </h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Blood Group</th>
                    <th scope="col">Inventory Type</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Donor Email</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((record) => (
                    <tr key={record._id}>
                      <td>{record.bloodGroup}</td>
                      <td>{record.inventoryType}</td>
                      <td>{record.quantity} (ML)</td>
                      <td>{record.email}</td>
                      <td>
                        {moment(record.createdAt).format("DD/MM/YYYY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal onRecordCreated={getBloodRecords} />
          </div>
        </>
      )}
    </Layout>
  );
};

export default HomePage;

