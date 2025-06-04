// src/ErrandPicker.jsx

import React, { useState, useEffect } from 'react';
import './ErrandPicker.css';

export default function ErrandPicker({
  isOpen,
  errandsRemaining,
  currentChoices,
  onSelect,
  onClose,
}) {
  const [localChoices, setLocalChoices] = useState([]);

  // Initialize localChoices to currentChoices when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalChoices(Array.isArray(currentChoices) ? [...currentChoices] : []);
    }
  }, [isOpen, currentChoices]);

  if (!isOpen) return null;

  // Put all current choices first, then the rest (so checked boxes appear at top)
  const combinedList = [
    ...(Array.isArray(currentChoices) ? currentChoices : []),
    ...errandsRemaining.filter((e) => !currentChoices.includes(e)),
  ];

  const toggleErrand = (errand) => {
    setLocalChoices((prev) => {
      if (prev.includes(errand)) {
        return prev.filter((x) => x !== errand);
      } else {
        return [...prev, errand];
      }
    });
  };

  const handleSave = () => {
    onSelect(localChoices);
  };
  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Select One or More Errands</h2>
        <ul className="errand-list">
          {combinedList.length === 0 ? (
            <li className="errand-list-item">No errands available</li>
          ) : (
            combinedList.map((errand, idx) => (
              <li key={idx} className="errand-list-item">
                <label>
                  <input
                    type="checkbox"
                    checked={localChoices.includes(errand)}
                    onChange={() => toggleErrand(errand)}
                  />{' '}
                  {errand}
                </label>
              </li>
            ))
          )}
        </ul>
        <div className="modal-buttons">
          <button className="modal-save-btn" onClick={handleSave}>
            Save
          </button>
          <button className="modal-cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
