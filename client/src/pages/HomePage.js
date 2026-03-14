import React, { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import Layout from "../components/Shared/Form/layout/layout";
import Modal from "../components/Shared/Form/modal/Modal";
import API from "../services/API";

const BLOOD_GROUPS = ["O-", "O+", "AB+", "AB-", "A+", "A-", "B+", "B-"];

const HomePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    inventoryType: "all",
    bloodGroup: "all",
    search: "",
  });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/inventory/get-inventory");
      if (data?.success) {
        setInventory(data.inventory || []);
      } else {
        toast.error(data?.message || "Unable to load inventory");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load inventory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const summary = useMemo(() => {
    return inventory.reduce(
      (acc, record) => {
        const qty = Number(record.quantity) || 0;
        if (record.inventoryType === "in") {
          acc.totalIn += qty;
        } else {
          acc.totalOut += qty;
        }
        acc.available = acc.totalIn - acc.totalOut;
        const group = record.bloodGroup || "Unknown";
        const delta = record.inventoryType === "in" ? qty : -qty;
        acc.byGroup[group] = (acc.byGroup[group] || 0) + delta;
        return acc;
      },
      { totalIn: 0, totalOut: 0, available: 0, byGroup: {} },
    );
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((record) => {
      if (
        filters.inventoryType !== "all" &&
        record.inventoryType !== filters.inventoryType
      )
        return false;

      if (filters.bloodGroup !== "all" && record.bloodGroup !== filters.bloodGroup)
        return false;

      return true;
    });
  }, [filters, inventory]);

  const roleLabel =
    user?.role === "organization"
      ? "Organization Inventory"
      : user?.role === "donor"
        ? "Donor Inventory"
        : "Inventory";

  return (
    <Layout>
      <div className="container mt-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div>
            <p className="mb-1 text-uppercase text-muted small">Dashboard</p>
            <h2 className="page-heading mb-0">{roleLabel}</h2>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={fetchInventory}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#staticBackdrop"
            >
              Add Record
            </button>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Total In</p>
                <h4 className="fw-bold">{summary.totalIn} ml</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Total Out</p>
                <h4 className="fw-bold">{summary.totalOut} ml</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted mb-1">Available</p>
                <h4 className="fw-bold text-danger">{summary.available} ml</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Inventory Type</label>
            <select
              className="form-select"
              value={filters.inventoryType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, inventoryType: e.target.value }))
              }
            >
              <option value="all">All</option>
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Blood Group</label>
            <select
              className="form-select"
              value={filters.bloodGroup}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, bloodGroup: e.target.value }))
              }
            >
              <option value="all">All</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Type</th>
                <th>Quantity (ml)</th>
                <th>Email</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((record) => {
                const isIn = record.inventoryType === "in";
                return (
                  <tr key={record._id}>
                    <td className="fw-semibold">{record.bloodGroup}</td>
                    <td className={isIn ? "text-success" : "text-danger"}>
                      {record.inventoryType?.toUpperCase()}
                    </td>
                    <td>{record.quantity}</td>
                    <td>{record.email || "-"}</td>
                    <td>{moment(record.createdAt).format("DD/MM/YYYY")}</td>
                  </tr>
                );
              })}
              {!loading && filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-muted">
                    No records found. Try adjusting filters or add a new record.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="6" className="text-muted">
                    Loading inventory...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal onRecordCreated={fetchInventory} />
    </Layout>
  );
};

export default HomePage;
