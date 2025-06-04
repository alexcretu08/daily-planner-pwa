import React, { useState, useEffect, useRef } from 'react';
import './ShoppingPicker.css';

export default function ShoppingPicker({
  isOpen,
  currentItems,
  currentDoneMapping,
  onSelect,
  onClose,
}) {
  const [localItems, setLocalItems] = useState([]);
  const [localDoneMap, setLocalDoneMap] = useState({});
  const [newItemText, setNewItemText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalItems(Array.isArray(currentItems) ? [...currentItems] : []);
      setLocalDoneMap({ ...(currentDoneMapping || {}) });
      setNewItemText('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 0);
    }
  }, [isOpen, currentItems, currentDoneMapping]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const text = newItemText.trim();
    if (text !== '' && !localItems.includes(text)) {
      setLocalItems((prev) => [...prev, text]);
      setLocalDoneMap((prev) => ({ ...prev, [text]: false }));
      setNewItemText('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleDeleteItem = (item) => {
    setLocalItems((prev) => prev.filter((i) => i !== item));
    setLocalDoneMap((prev) => {
      const copy = { ...prev };
      delete copy[item];
      return copy;
    });
  };

  const toggleDoneItem = (item) => {
    setLocalDoneMap((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleSave = () => {
    onSelect(localItems, localDoneMap);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content shopping-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="modal-title">Shopping List</h2>
        <div className="add-item-section">
          <input
            ref={inputRef}
            type="text"
            placeholder="New item…"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddItem();
              }
            }}
            className="add-item-input"
          />
          <button
            className="add-item-btn"
            onClick={handleAddItem}
            disabled={newItemText.trim() === ''}
          >
            Add
          </button>
        </div>
        <ul className="shopping-list">
          {localItems.length === 0 ? (
            <li className="shopping-list-item">(No items yet – add above)</li>
          ) : (
            localItems.map((item, idx) => (
              <li key={idx} className="shopping-list-item">
                <label className="shopping-item-label">
                  <input
                    type="checkbox"
                    checked={!!localDoneMap[item]}
                    onChange={() => toggleDoneItem(item)}
                  />
                  <span
                    className={
                      localDoneMap[item]
                        ? 'shopping-item-text bought'
                        : 'shopping-item-text'
                    }
                  >
                    {item}
                  </span>
                </label>
                <button
                  className="delete-item-btn"
                  onClick={() => handleDeleteItem(item)}
                  title="Remove this item"
                >
                  ×
                </button>
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
