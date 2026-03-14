import moment from "moment";

import React, { useCallback, useEffect, useRef, useState } from "react";
import API from "../../services/API";
import Layout from "../../components/Shared/Form/layout/layout";
const Analytics = () => {
  const [data, setData] = useState([]);

  const [totals, setTotals] = useState({ totalIn: 0, totalOut: 0, available: 0 });
  const [loading, setLoading] = useState(false);

  const [inventoryData, setInventoryData] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txSort, setTxSort] = useState("desc"); // createdAt: desc (newest first)
  const [txLoading, setTxLoading] = useState(false);

  const txPageRef = useRef(1);
  const txSortRef = useRef("desc");
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


  const getSummaryData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/analytics/dashboard-data");
      if (data?.success) {
        setData(data?.bloodGroupData);
        setTotals(data?.totals || { totalIn: 0, totalOut: 0, available: 0 });
      }
    } catch (error) {
      console.log(error);

    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactions = useCallback(async ({ page, sort } = {}) => {
    try {
      setTxLoading(true);
      const params = {
        page: page ?? txPageRef.current,
        limit: 10,
        sort: sort ?? txSortRef.current,
      };

      const { data } = await API.get("/analytics/transactions", { params });
      if (data?.success) {
        setInventoryData(data?.items || []);
        txPageRef.current = data?.page || 1;
        setTxPage(txPageRef.current);
        setTxTotalPages(data?.totalPages || 1);
        setTxTotal(data?.total || 0);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTxLoading(false);
    }
  }, []);

  const buildPageNumbers = (current, totalPages) => {
    const pages = [];
    const safeTotal = Math.max(totalPages || 1, 1);
    const safeCurrent = Math.min(Math.max(current || 1, 1), safeTotal);

    const windowSize = 5;
    let start = Math.max(safeCurrent - Math.floor(windowSize / 2), 1);
    let end = Math.min(start + windowSize - 1, safeTotal);
    start = Math.max(end - windowSize + 1, 1);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < safeTotal - 1) pages.push("...");
    if (end < safeTotal) pages.push(safeTotal);
    return pages;
  };

  useEffect(() => {
    getSummaryData();
    getTransactions({ page: 1 });

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        getSummaryData();
        getTransactions();
      }
    }, 15000);

    const onFocus = () => {
      getSummaryData();
      getTransactions();
    };
    window.addEventListener("focus", onFocus);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        getSummaryData();
        getTransactions();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [getSummaryData, getTransactions]);

  const onClickDateHeader = async () => {
    const nextSort = txSort === "desc" ? "asc" : "desc";
    setTxSort(nextSort);
    txSortRef.current = nextSort;
    await getTransactions({ page: 1, sort: nextSort });
  };

  return (
    <Layout>
      <div className="container my-3">

        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="m-0 page-heading">Analytics Summary</h3>
        </div>
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

            key={record.bloodGroup || i}
            style={{
              width: "18rem",
              backgroundColor: colors[i % colors.length],
            }}
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

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 my-3">
          <h1 className="m-0 page-heading">Recent Blood Transactions</h1>
        </div>
        <div className="table-responsive">
          <table className="table ">
            <thead>
              <tr>
                <th scope="col">Blood Group</th>
                <th scope="col">Inventory Type</th>
                <th scope="col">Quantity</th>
                <th scope="col">Email</th>

                <th scope="col">
                  <button
                    type="button"
                    className="p-0 border-0 bg-transparent text-dark"
                    style={{ textDecoration: "none" }}
                    onClick={onClickDateHeader}
                    disabled={txLoading}
                    aria-label="Sort by date"
                  >
                    Date {txSort === "desc" ? "↓" : "↑"}
                  </button>
                </th>
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


        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="text-muted">
            Showing {inventoryData.length} of {txTotal}
          </div>
          <nav aria-label="Transactions pagination">
            <ul className="pagination pagination-sm m-0">
              <li className={`page-item ${txPage <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => getTransactions({ page: txPage - 1 })}
                  disabled={txLoading || txPage <= 1}
                >
                  Prev
                </button>
              </li>
              {buildPageNumbers(txPage, txTotalPages).map((p, idx) => (
                <li
                  key={`${p}-${idx}`}
                  className={`page-item ${p === txPage ? "active" : ""} ${p === "..." ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    type="button"
                    onClick={() => p !== "..." && getTransactions({ page: p })}
                    disabled={txLoading || p === "..."}
                  >
                    {p}
                  </button>
                </li>
              ))}
              <li className={`page-item ${txPage >= txTotalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => getTransactions({ page: txPage + 1 })}
                  disabled={txLoading || txPage >= txTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
