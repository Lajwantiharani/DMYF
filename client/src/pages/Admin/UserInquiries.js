import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";

const formatWhen = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const UserInquiries = () => {
  const [threads, setThreads] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread | read
  const [selectedId, setSelectedId] = useState(null);
  const [threadDetails, setThreadDetails] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const unreadCount = useMemo(
    () => threads.filter((t) => Boolean(t.unreadForAdmin)).length,
    [threads],
  );

  const filteredThreads = useMemo(() => {
    if (filter === "unread") return threads.filter((t) => Boolean(t.unreadForAdmin));
    if (filter === "read") return threads.filter((t) => !t.unreadForAdmin);
    return threads;
  }, [threads, filter]);

  const selectedThreadSummary = useMemo(
    () => threads.find((t) => t._id === selectedId) || null,
    [threads, selectedId],
  );

  const loadThreads = async () => {
    setLoadingList(true);
    try {
      const { data } = await API.get("/inquiries/admin/threads");
      if (!data?.success) {
        toast.error(data?.message || "Unable to load inquiries");
        return;
      }
      const nextThreads = data.items || [];
      setThreads(nextThreads);
      setSelectedId((currentSelectedId) => {
        if (!nextThreads.length) return null;
        return nextThreads.some((thread) => thread._id === currentSelectedId)
          ? currentSelectedId
          : nextThreads[0]._id;
      });
      if (!nextThreads.length) {
        setThreadDetails(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load inquiries");
    } finally {
      setLoadingList(false);
    }
  };

  const loadThread = async (id) => {
    if (!id) return;
    setLoadingThread(true);
    try {
      const { data } = await API.get(`/inquiries/admin/threads/${id}`);
      if (!data?.success) {
        toast.error(data?.message || "Unable to load conversation");
        return;
      }
      setThreadDetails(data.thread);

      if (data.unreadForAdmin) {
        await API.post(`/inquiries/admin/threads/${id}/read`);
        setThreads((prev) =>
          prev.map((t) => (t._id === id ? { ...t, unreadForAdmin: false } : t)),
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load conversation");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadThread(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleReply = async (e) => {
    e.preventDefault();
    const trimmed = reply.trim();
    if (!trimmed || !selectedId) return;
    setSending(true);
    try {
      const { data } = await API.post(`/inquiries/admin/threads/${selectedId}/reply`, {
        message: trimmed,
      });
      if (!data?.success) {
        toast.error(data?.message || "Unable to send reply");
        return;
      }
      setReply("");
      setThreadDetails(data.thread);
      setThreads((prev) =>
        [
          {
            ...(prev.find((t) => t._id === selectedId) || {}),
            _id: selectedId,
            lastMessageAt: data.thread?.lastMessageAt || new Date().toISOString(),
            unreadForAdmin: false,
            lastMessagePreview: trimmed.slice(0, 80),
            user:
              prev.find((t) => t._id === selectedId)?.user || data.thread?.user || null,
          },
          ...prev.filter((t) => t._id !== selectedId),
        ],
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4" style={{ maxWidth: "1100px" }}>
        <h3 className="mb-3 page-heading">User Inquiries</h3>

        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="inquiry-thread-list">
              <div className="d-flex gap-2 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm ${filter === "all" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    filter === "unread" ? "btn-dark" : "btn-outline-dark"
                  }`}
                  onClick={() => setFilter("unread")}
                >
                  Unread
                  <span className="badge text-bg-danger ms-2">{unreadCount}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filter === "read" ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setFilter("read")}
                >
                  Read
                </button>
              </div>
              {loadingList ? (
                <div className="text-muted">Loading...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-muted">No inquiries yet.</div>
              ) : (
                filteredThreads.map((t) => {
                  const isActive = t._id === selectedId;
                  return (
                    <button
                      key={t._id}
                      type="button"
                      className={`inquiry-thread-item ${
                        t.unreadForAdmin ? "unread" : ""
                      } ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedId(t._id)}
                    >
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="text-start">
                          <div className="fw-semibold">
                            {t.user?.name || "User"}{" "}
                            <span className="badge text-bg-secondary ms-1">
                              {t.user?.role || "-"}
                            </span>
                          </div>
                          <div className="text-muted small">{t.user?.email || ""}</div>
                        </div>
                        <div className="text-muted small ms-2">
                          {t.lastMessageAt ? formatWhen(t.lastMessageAt) : ""}
                        </div>
                      </div>
                      {t.lastMessagePreview ? (
                        <div className="text-muted small mt-1">{t.lastMessagePreview}</div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="inquiry-conversation">
              {!selectedId ? (
                <div className="text-muted">Select a conversation.</div>
              ) : loadingThread ? (
                <div className="text-muted">Loading conversation...</div>
              ) : (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="fw-semibold">
                      {selectedThreadSummary?.user?.name || threadDetails?.user?.name || "User"}
                      <span className="text-muted ms-2">
                        {selectedThreadSummary?.user?.email || threadDetails?.user?.email || ""}
                      </span>
                    </div>
                  </div>

                  <div className="inquiry-messages">
                    {(threadDetails?.messages || []).length === 0 ? (
                      <div className="text-muted">No messages.</div>
                    ) : (
                      (threadDetails?.messages || []).map((m) => {
                        const isAdmin = m.senderRole === "admin";
                        const isSeen =
                          isAdmin && threadDetails?.lastReadAtUser
                            ? new Date(m.createdAt).getTime() <=
                              new Date(threadDetails.lastReadAtUser).getTime()
                            : false;
                        return (
                          <div
                            key={m._id || `${m.createdAt}-${m.message}`}
                            className={`inquiry-message ${isAdmin ? "me" : "admin"}`}
                          >
                            <div className="inquiry-message-meta">
                              <span className="inquiry-message-from">
                                {isAdmin ? "Admin" : threadDetails?.user?.name || "User"}
                              </span>
                              <span className="inquiry-message-when">
                                {formatWhen(m.createdAt)}
                                {isAdmin ? (
                                  <span className="ms-2 inquiry-message-status">
                                    {isSeen ? "Seen" : "Sent"}
                                  </span>
                                ) : null}
                              </span>
                            </div>
                            <div className="inquiry-message-body">{m.message}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleReply} className="mt-3">
                    <label className="form-label fw-semibold">Reply</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write your reply..."
                      maxLength={2000}
                      required
                    />
                    <div className="d-flex justify-content-end pe-2 mt-3">
                      <button type="submit" className="btn btn-danger px-4" disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserInquiries;
