import React from "react";
import "./SearchHelpModal.css";

export default function SearchHelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="sh-overlay" onClick={onClose}>
      <div className="sh-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="sh-title">How to Search</h3>

        <p className="sh-text">
          You can search by <strong>recipe name</strong>, <strong>ingredient</strong>,
          or <strong>category</strong>.
        </p>

        <button className="sh-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
