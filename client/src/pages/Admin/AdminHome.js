import React from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import { useSelector } from "react-redux";
import moment from "moment";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex flex-column">
          <h2 className="mb-3">
            Welcome Admin <span className="text-success">{user?.name}</span>
          </h2>
          <h4 className="mb-4">Admin Dashboard - Manage Blood Bank App</h4>

          {user ? (
            <div className="card shadow p-4 mb-4">
              <h5 className="mb-3">Admin Profile</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>Name:</strong> {user.name}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Email:</strong> {user.email}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Phone:</strong> {user.phone || "N/A"}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Role:</strong> {user.role}
                </div>
                <div className="col-md-6 mb-3">
                  <strong>Registered On:</strong>{" "}
                  {moment(user.createdAt).format("DD/MM/YYYY hh:mm A")}
                </div>
              </div>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}

          <hr />
          <p className="text-muted">
            Welcome to the Blood Bank Admin Panel. From here you can manage users,
            view inventory, and control system-wide configurations.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;
