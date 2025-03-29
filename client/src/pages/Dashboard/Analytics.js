import moment from "moment";
import React, { useState, useEffect } from "react";
import API from "../../services/API";
import Header from "../../components/Shared/Form/layout/header";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const colors = [
    "#884A39",
    "#C38154",
    "#FFC26F",
    "#4F709C",
    "#4942E4",
    "#0079FF",
    "#FF0060",
    "#22A699",
  ];

  // GET BLOOD GROUP DATA
  const getBloodGroupData = async () => {
    try {
      const { data } = await API.get("/analytics/bloodGroups-data");
      if (data?.success) {
        console.log("Blood Group Data:", data.bloodGroupData); // Log the data
        setData(data?.bloodGroupData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Lifecycle method
  useEffect(() => {
    getBloodGroupData();
  }, []);

  // Get function for recent blood records
  const getBloodRecords = async () => {
    try {
      const { data } = await API.get("/inventory/get-recent-inventory");
      if (data?.success) {
        setInventoryData(data?.inventory);
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBloodRecords();
  }, []);

  return (
    <>
      <Header />
      <div className="main-content">
        <div className="card-container">
          {data?.map((record, i) => (
            <div
              className="card"
              key={i}
              style={{ backgroundColor: `${colors[i % colors.length]}` }}
            >
              <div className="card-body">
                <h1 className="card-title bg-light text-dark text-center mb-3">
                  {record.bloodGroup}
                </h1>
                <p className="card-text">
                  Total In: <b>{record.totalIn}</b> (ML)
                </p>
                <p className="card-text">
                  Total Out: <b>{record.totalOut}</b> (ML)
                </p>
              </div>
              <div className="card-footer text-light bg-dark text-center">
                Total Available: <b>{record.availableBlood}</b> (ML)
              </div>
            </div>
          ))}
        </div>
        <div className="container my-3">
          <h1 className="my-3">Recent Blood Transactions</h1>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Blood Group</th>
                <th scope="col">Inventory Type</th>
                <th scope="col">Quantity</th>
                <th scope="col">Donor Email</th>
                <th scope="col">Time & Date</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData?.map((record) => (
                <tr key={record._id}>
                  <td>{record.bloodGroup}</td>
                  <td>{record.inventoryType}</td>
                  <td>{record.quantity} (ML)</td>
                  <td>{record.email}</td>
                  <td>
                    {moment(record.createdAt).format("DD/MM/YYYY hh:mm A")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Analytics;
