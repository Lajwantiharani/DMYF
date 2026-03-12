
import moment from "moment";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";

import CityAutocompleteInput from "../../components/Shared/CityAutocompleteInput";

const bloodGroups = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const Receiver = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("search");
  const [searchLoading, setSearchLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [searchForm, setSearchForm] = useState({
    bloodGroup: "",
    city: user?.city || "",
    quantity: "",
  });
  const [searchResults, setSearchResults] = useState({
    donors: [],
    organizations: [],
  });

  const [selectedDonors, setSelectedDonors] = useState([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);

  const [availabilityForm, setAvailabilityForm] = useState({
    bloodGroup: "",
    quantity: "",
  });


  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);

  const hasResults = useMemo(
    () =>
      (searchResults?.donors?.length || 0) > 0 ||
      (searchResults?.organizations?.length || 0) > 0,
    [searchResults],
  );


  const renderAvailabilityColGroup = () => (
    <colgroup>
      <col style={{ width: "35%" }} />
      <col style={{ width: "30%" }} />
      <col style={{ width: "20%" }} />
      <col style={{ width: "15%" }} />
    </colgroup>
  );

  const renderRequestsColGroup = () => (
    <colgroup>
      <col style={{ width: "16%" }} />
      <col style={{ width: "22%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "18%" }} />
    </colgroup>
  );

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSearch = async (e) => {
    e.preventDefault();
    if (!searchForm.bloodGroup || !searchForm.city) {
      toast.error("Blood group and city are required");
      return;
    }

    setSearchLoading(true);
    setSelectedDonors([]);
    setSelectedOrganizations([]);
    try {
      const { data } = await API.post("/receiver/search-availability", {
        bloodGroup: searchForm.bloodGroup,
        city: searchForm.city,
        quantity: Number(searchForm.quantity || 0),
      });

      if (data?.success) {
        setSearchResults({
          donors: data?.donors || [],
          organizations: data?.organizations || [],
        });
      } else {
        toast.error(data?.message || "Unable to fetch results");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to fetch results");
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleSelected = (type, userId) => {
    if (type === "donor") {
      setSelectedDonors((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
      );
      return;
    }

    setSelectedOrganizations((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const updateRequestSentLocally = (type, userId) => {
    if (type === "donor") {
      setSearchResults((prev) => ({
        ...prev,
        donors: prev.donors.map((donor) =>
          String(donor.userId) === String(userId)

            ? { ...donor, requestStatus: "pending" }
            : donor,
        ),
      }));
      return;
    }

    setSearchResults((prev) => ({
      ...prev,
      organizations: prev.organizations.map((org) =>

        String(org.userId) === String(userId) ? { ...org, requestStatus: "pending" } : org,
      ),
    }));
  };


  const loadMyRequests = async () => {
    setMyRequestsLoading(true);
    try {
      const { data } = await API.get("/receiver/my-requests", {
        params: { status: "all" },
      });
      if (!data?.success) {
        toast.error(data?.message || "Unable to fetch requests");
        return;
      }

      const requests = data?.requests || [];
      setPendingRequests(requests.filter((r) => r.status === "pending"));
      setApprovedRequests(
        requests.filter((r) => r.status === "accepted" || r.status === "approved"),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to fetch requests");
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const onSendRequest = async () => {
    if (!searchForm.bloodGroup || !searchForm.city || !searchForm.quantity) {
      toast.error("Blood group, city and quantity are required");
      return;
    }

    const quantity = Number(searchForm.quantity);
    if (!quantity || quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const selectedTargets = [
      ...selectedDonors.map((id) => ({ id, type: "donor" })),
      ...selectedOrganizations.map((id) => ({ id, type: "organization" })),
    ];

    if (!selectedTargets.length) {
      toast.error("Please select at least one donor or organization");
      return;
    }

    setRequestLoading(true);
    try {
      const responses = await Promise.allSettled(
        selectedTargets.map((target) =>
          API.post("/receiver/send-request", {
            targetUserId: target.id,
            targetType: target.type,
            bloodGroup: searchForm.bloodGroup,
            city: searchForm.city,
            quantity,
          }),
        ),
      );

      let successCount = 0;
      responses.forEach((result, index) => {
        const target = selectedTargets[index];
        if (result.status === "fulfilled" && result.value?.data?.success) {
          successCount += 1;
          updateRequestSentLocally(target.type, target.id);
        }
      });

      setSelectedDonors([]);
      setSelectedOrganizations([]);

      if (successCount > 0) {
        toast.success("Request sent. Please wait for email confirmation.");
      } else {
        toast.error("Unable to send request");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  const onRequestAvailability = async (e) => {
    e.preventDefault();
    const quantity = Number(availabilityForm.quantity);

    if (!availabilityForm.bloodGroup || !quantity || quantity <= 0) {
      toast.error("Blood group and valid quantity are required");
      return;
    }

    setAvailabilityLoading(true);
    try {
      const { data } = await API.post("/receiver/request-availability", {
        bloodGroup: availabilityForm.bloodGroup,
        quantity,
      });

      if (data?.success) {
        toast.success("Request sent successfully.");
        setAvailabilityForm({ bloodGroup: "", quantity: "" });
      } else {
        toast.error(data?.message || "Unable to send request");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send request");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">

        <h4 className="mb-3 page-heading">Receiver Blood Request</h4>

        <ul className="nav nav-tabs mb-3 receiver-tabs">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link receiver-tab-btn ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              Donor  Availability
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link receiver-tab-btn ${activeTab === "request" ? "active" : ""}`}
              onClick={() => setActiveTab("request")}
            >
              Make  a Request 
            </button>
          </li>

          <li className="nav-item">
            <button
              type="button"
              className={`nav-link receiver-tab-btn ${activeTab === "my-requests" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("my-requests");
                loadMyRequests();
              }}
            >
              My Requests
            </button>
          </li>
        </ul>

        {activeTab === "search" && (
          <div>
            <form className="row g-3 align-items-end" onSubmit={onSearch}>
              <div className="col-12 col-md-4">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-select"
                  name="bloodGroup"
                  value={searchForm.bloodGroup}
                  onChange={handleSearchChange}
                  required
                >
                  {bloodGroups.map((group) => (
                    <option key={group || "none"} value={group}>
                      {group || "Select blood group"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">City</label>

                <CityAutocompleteInput
                  name="city"
                  value={searchForm.city}
                  onChange={(next) => setSearchForm((prev) => ({ ...prev, city: next }))}
                  required
                  placeholder="Start typing (e.g. La, hyd)"
                />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label">Quantity (ML)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  name="quantity"
                  value={searchForm.quantity}
                  onChange={handleSearchChange}
                  placeholder="e.g. 4"
                  required
                />
              </div>
              <div className="col-12 col-md-2">
                <button className="btn btn-danger w-100" type="submit" disabled={searchLoading}>
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            <div className="mt-4">
              <h5>Donor List</h5>
              <div className="table-responsive">

                <table className="table" style={{ tableLayout: "fixed" }}>
                  {renderAvailabilityColGroup()}
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Available Quantity (ML)</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.donors.map((donor) => (
                      <tr key={donor.userId}>
                        <td>{donor.name || "-"}</td>
                        <td>{donor.contact || donor.email || "-"}</td>
                        <td>{donor.availableQuantity}</td>
                        <td>

                          {donor.requestStatus === "pending" ? (
                            <span className="badge bg-secondary">Pending</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedDonors.includes(donor.userId)}
                              onChange={() => toggleSelected("donor", donor.userId)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {searchResults.donors.length === 0 && (
                      <tr>

                        <td colSpan="4" className="text-muted text-center">
                          No donors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h5 className="mt-4">Organization List</h5>
              <div className="table-responsive">

                <table className="table" style={{ tableLayout: "fixed" }}>
                  {renderAvailabilityColGroup()}
                  <thead>
                    <tr>
                      <th>Organization Name</th>
                      <th>Contact</th>
                      <th>Available Quantity (ML)</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.organizations.map((org) => (
                      <tr key={org.userId}>
                        <td>{org.organizationName || "-"}</td>
                        <td>{org.contact || org.email || "-"}</td>
                        <td>{org.availableQuantity}</td>
                        <td>

                          {org.requestStatus === "pending" ? (
                            <span className="badge bg-secondary">Pending</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={selectedOrganizations.includes(org.userId)}
                              onChange={() => toggleSelected("organization", org.userId)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    {searchResults.organizations.length === 0 && (
                      <tr>

                        <td colSpan="4" className="text-muted text-center">
                          No organizations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {hasResults ? (
                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  onClick={onSendRequest}
                  disabled={requestLoading}
                >
                  {requestLoading ? "Sending..." : "Request"}
                </button>
              ) : (
                <p className="text-muted mt-3 mb-0">
                  If no results are available, use tab 2 (Request Availability).
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "request" && (
          <form className="row g-3" onSubmit={onRequestAvailability}>
            <div className="col-12 col-md-6">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={user?.name || ""}
                disabled
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ""}
                disabled
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Nukh</label>
              <input
                type="text"
                className="form-control"
                value={user?.nukh || ""}
                disabled
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                name="bloodGroup"
                value={availabilityForm.bloodGroup}
                onChange={handleAvailabilityChange}
                required
              >
                {bloodGroups.map((group) => (
                  <option key={group || "none"} value={group}>
                    {group || "Select blood group"}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Quantity (ML)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                name="quantity"
                value={availabilityForm.quantity}
                onChange={handleAvailabilityChange}
                required
              />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-danger" disabled={availabilityLoading}>
                {availabilityLoading ? "Submitting..." : "Request"}
              </button>
            </div>
          </form>
        )}


        {activeTab === "my-requests" && (
          <div className="mt-3">
            {myRequestsLoading ? (
              <p className="text-muted mb-0">Loading requests...</p>
            ) : (
              <>
                <h5 className="mb-2">Pending Requests</h5>
                <div className="table-responsive">
                  <table className="table" style={{ tableLayout: "fixed" }}>
                    {renderRequestsColGroup()}
                    <thead>
                      <tr>
                        <th>To</th>
                        <th>Contact</th>
                        <th>Blood Group</th>
                        <th>Quantity (ML)</th>
                        <th>City</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((req) => {
                        const target = req?.targetUser;
                        const targetName =
                          target?.role === "organization"
                            ? target?.organizationName
                            : target?.name;
                        return (
                          <tr key={req._id}>
                            <td>{targetName || "-"}</td>
                            <td>{target?.phone || target?.email || "-"}</td>
                            <td>{req.bloodGroup}</td>
                            <td>{req.quantity}</td>
                            <td>{req.city || "-"}</td>
                            <td>{moment(req.createdAt).format("DD/MM/YYYY")}</td>
                          </tr>
                        );
                      })}
                      {pendingRequests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-muted text-center">
                            No pending requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <h5 className="mt-4 mb-2">Approved Requests</h5>
                <div className="table-responsive">
                  <table className="table" style={{ tableLayout: "fixed" }}>
                    {renderRequestsColGroup()}
                    <thead>
                      <tr>
                        <th>To</th>
                        <th>Contact</th>
                        <th>Blood Group</th>
                        <th>Quantity (ML)</th>
                        <th>City</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedRequests.map((req) => {
                        const target = req?.targetUser;
                        const targetName =
                          target?.role === "organization"
                            ? target?.organizationName
                            : target?.name;
                        return (
                          <tr key={req._id}>
                            <td>{targetName || "-"}</td>
                            <td>{target?.phone || target?.email || "-"}</td>
                            <td>{req.bloodGroup}</td>
                            <td>{req.quantity}</td>
                            <td>{req.city || "-"}</td>
                            <td>{moment(req.createdAt).format("DD/MM/YYYY")}</td>
                          </tr>
                        );
                      })}
                      {approvedRequests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-muted text-center">
                            No approved requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Receiver;
