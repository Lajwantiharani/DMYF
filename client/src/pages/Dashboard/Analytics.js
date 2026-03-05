import moment from "moment";
import React, { useState, useEffect } from "react";
import API from "../../services/API";
import Layout from "../../components/Shared/Form/layout/layout";
const Analytics = () => {
  const [data, setData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [totals, setTotals] = useState({ totalIn: 0, totalOut: 0, available: 0 });
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

  const getAnalyticsData = async () => {
    try {
      const { data } = await API.get("/analytics/dashboard-data");
      if (data?.success) {
        setData(data?.bloodGroupData);
        setInventoryData(data?.recentTransactions || []);
        setTotals(data?.totals || { totalIn: 0, totalOut: 0, available: 0 });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAnalyticsData();
  }, []);

  return (
    <Layout>
      <div className="container my-3">
        <h3 className="mb-3">Analytics Summary</h3>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card p-3">
              <h6>Total IN</h6>
              <h4>{totals.totalIn} ML</h4>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3">
              <h6>Total OUT</h6>
              <h4>{totals.totalOut} ML</h4>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card p-3">
              <h6>Total Available</h6>
              <h4>{totals.available} ML</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-row flex-wrap">
        {data?.map((record, i) => (
          <div
            className="card m-2 p-1"
            key={i}
            style={{ width: "18rem", backgroundColor: `${colors[i]}` }}
          >
            <div className="card-body">
              <h1 className="card-title bg-light text-dark text-center mb-3">
                {record.bloodGroup}
              </h1>
              <p className="card-text">
                Total In : <b>{record.totalIn}</b> (ML)
              </p>
              <p className="card-text">
                Total Out : <b>{record.totalOut}</b> (ML)
              </p>
            </div>
            <div className="card-footer text-light bg-dark text-center">
              Total Available : <b>{record.availabeBlood}</b> (ML)
            </div>
          </div>
        ))}
      </div>
      <div className="container my-3">
        <h1 className="my-3">Recent Blood Transactions</h1>
        <div className="table-responsive">
          <table className="table ">
            <thead>
              <tr>
                <th scope="col">Blood Group</th>
                <th scope="col">Inventory Type</th>
                <th scope="col">Quantity</th>
                <th scope="col">Email</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData?.map((record) => (
                <tr key={record._id}>
                  <td>{record.bloodGroup}</td>
                  <td>{record.inventoryType}</td>
                  <td>{record.quantity} (ML)</td>
                  <td>{record.email}</td>
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

export default Analytics;
