// SharedComponents.js - Reusable UI components
import React, { useRef } from "react";

// Reusable file upload area component
export const FileUploadArea = ({
  previewUrl,
  triggerFileInput,
  isProcessing,
  uploadPlaceholder = "Click to upload an image",
}) => {
  return (
    <div className="upload-area" onClick={triggerFileInput}>
      {previewUrl ? (
        <img src={previewUrl} alt="Selected" className="preview-image" />
      ) : (
        <div className="upload-placeholder">
          <i className="upload-icon">📁</i>
          <p>{uploadPlaceholder}</p>
        </div>
      )}
    </div>
  );
};

// Reusable file action buttons component
export const FileActionButtons = ({
  selectedImage,
  triggerFileInput,
  onReset,
  isProcessing,
  onToggleHistory,
  showHistory,
  onDeleteHistory,
}) => {
  return (
    <div className="file-actions">
      <button
        className="select-file-btn"
        onClick={triggerFileInput}
        disabled={isProcessing}
      >
        {selectedImage ? "Change Image" : "Select Image"}
      </button>
      {selectedImage && (
        <button className="reset-btn" onClick={onReset} disabled={isProcessing}>
          Reset
        </button>
      )}
      <button
        className="history-btn"
        onClick={onToggleHistory}
        disabled={isProcessing}
      >
        {showHistory ? "Hide History" : "View History"}
      </button>
      <button
        className="delete-history-btn"
        onClick={() => {
          if (
            window.confirm(
              "Are you sure you want to delete all history? This cannot be undone."
            )
          ) {
            onDeleteHistory();
          }
        }}
      >
        <i className="trash-icon">🗑️</i> Delete History
      </button>
    </div>
  );
};

// Reusable status message component
export const StatusMessage = ({ status }) => {
  if (!status) return null;

  return (
    <div className={`status-message ${status.success ? "success" : "error"}`}>
      {status.message}
    </div>
  );
};

// Reusable history panel component
export const HistoryPanel = ({
  showHistory,
  historyPanelRef,
  title,
  items,
  onLoadItem,
  onDeleteItem,
}) => {
  if (!showHistory) return null;

  return (
    <div className="history-panel" ref={historyPanelRef}>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>No saved items found.</p>
      ) : (
        <ul className="history-list">
          {items.map((item) => (
            <li
              key={item._id}
              className="history-item"
              onClick={() => onLoadItem(item)}
            >
              <div className="history-item-details">
                <span className="history-item-name">
                  {item.fileName || "Unnamed Analysis"}
                </span>
                <span className="history-item-type">
                  {item.analysisSubtype
                    ? item.analysisSubtype
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")
                    : "Analysis"}
                </span>
                <span className="history-item-date">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                className="delete-history-btn"
                onClick={(e) => onDeleteItem(item._id, e)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
