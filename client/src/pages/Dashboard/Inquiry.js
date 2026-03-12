import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/Shared/Form/layout/layout";
import API from "../../services/API";
import { useSelector } from "react-redux";

const formatWhen = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const Inquiry = () => {
  const { user } = useSelector((state) => state.auth);
  const pageTitle = user?.role === "admin" ? "Inquiry" : "Technical Support";
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const messages = useMemo(() => thread?.messages || [], [thread]);
  const unreadForUser = Boolean(thread?.unreadForUser);
  const lastReadAtAdmin = thread?.lastReadAtAdmin ? new Date(thread.lastReadAtAdmin) : null;

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/inquiries/me");
      if (!data?.success) {
        toast.error(data?.message || "Unable to load inquiries");
        return;
      }
      setThread(data.thread);

      if (data.thread?.unreadForUser) {
        await API.post("/inquiries/me/read");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const { data } = await API.post("/inquiries/me/message", { message: trimmed });
      if (!data?.success) {
        toast.error(data?.message || "Unable to send message");
        return;
      }
      setMessage("");
      setThread(data.thread);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4" style={{ maxWidth: "980px" }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="page-heading mb-0">{pageTitle}</h3>
          {unreadForUser && (
            <span className="badge text-bg-danger">New reply</span>
          )}
        </div>

        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : (
          <>
            <div className="inquiry-messages">
              {messages.length === 0 ? (
                <div className="text-muted">No messages yet. Ask your question below.</div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole !== "admin";
                  const isSeen =
                    isMe && lastReadAtAdmin
                      ? new Date(m.createdAt).getTime() <= lastReadAtAdmin.getTime()
                      : false;
                  return (
                    <div
                      key={m._id || `${m.createdAt}-${m.message}`}
                      className={`inquiry-message ${isMe ? "me" : "admin"}`}
                    >
                      <div className="inquiry-message-meta">
                        <span className="inquiry-message-from">
                          {isMe ? "You" : "Admin"}
                        </span>
                        <span className="inquiry-message-when">
                          {formatWhen(m.createdAt)}
                          {isMe ? (
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
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="mt-3">
              <label className="form-label fw-semibold">Message</label>
              <textarea
                className="form-control"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
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
    </Layout>
  );
};

export default Inquiry;
