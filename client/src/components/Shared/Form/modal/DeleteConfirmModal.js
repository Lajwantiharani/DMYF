import React from "react";

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, role, name }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "30px 40px",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5
          style={{
            fontSize: "1.1rem",
            fontWeight: "600",
            color: "#333",
            marginBottom: "20px",
          }}
        >
          Are you sure you want to delete this {role}?
        </h5>
        {name && (
          <p
            style={{
              fontSize: "0.95rem",
              color: "#666",
              marginBottom: "25px",
            }}
          >
            <strong>{name}</strong>
          </p>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "15px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 30px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#dc3545",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#c82333")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#dc3545")}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 30px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#28a745",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#218838")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#28a745")}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
