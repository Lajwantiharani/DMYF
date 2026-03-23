import React, { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Shared/Form/layout/layout";
import { useSelector } from "react-redux";
import API from "../../services/API";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({ registeredUsers: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);

  const getDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/dashboard-stats");
      if (data?.success) {
        setStats({
          registeredUsers: data?.stats?.registeredUsers || 0,
          activeUsers: data?.stats?.activeUsers || 0,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDashboardStats();

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        getDashboardStats();
      }
    }, 15000);

    const onFocus = () => {
      getDashboardStats();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        getDashboardStats();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [getDashboardStats]);

  return (
    <Layout>
      <div className="container admin-dashboard-page">
        <div className="d-flex flex-column mt-2">
          <h1 className="page-heading">Welcome to Dashboard</h1>
          <p className="text-muted mb-4">
            Signed in as {user?.name || "Admin"}
          </p>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="card admin-dashboard-stat-card h-100">
                <div className="card-body">
                  <span className="admin-dashboard-stat-label">Registered Users</span>
                  <h2 className="admin-dashboard-stat-value">
                    {loading ? "..." : stats.registeredUsers}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card admin-dashboard-stat-card h-100">
                <div className="card-body">
                  <span className="admin-dashboard-stat-label">Active Users</span>
                  <h2 className="admin-dashboard-stat-value">
                    {loading ? "..." : stats.activeUsers}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};


export default AdminHome;
