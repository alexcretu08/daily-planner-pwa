// src/App.jsx

import React, { useState, useEffect } from 'react';
import ErrandPicker from './ErrandPicker';
import scheduleData from './schedule.json';
import './App.css';

/**
 * Your Apps Script /exec URL (deployed previously).
 * This must be the exact URL ending in /exec, not /dev.
 */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby2-1x_gCDPCvdxMMI3w66VcGgN9ga2gh-okbWJxz-ZOEBP1KGF-VVswe8bmFSgt7mD/exec";

function App() {
  // ───────────────────────────────────────────────────────────────
  // 1. RUNNING‐TOTAL EXPENSES (CHF) LOGIC (editable total)
  // ───────────────────────────────────────────────────────────────

  // On component mount, read the stored total (or default to 0)
  const [runningExpenses, setRunningExpenses] = useState(() => {
    const stored = localStorage.getItem('dailyPlannerTotalExpenses');
    return stored ? parseFloat(stored) : 0;
  });

  // Save the running total back to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      'dailyPlannerTotalExpenses',
      runningExpenses.toString()
    );
  }, [runningExpenses]);

  // Input for “today’s new expense” amount
  const [todaysExpenseInput, setTodaysExpenseInput] = useState('');

  // Called when you click the “Add” button to add today’s expense
  const addTodaysExpense = () => {
    const value = parseFloat(todaysExpenseInput);
    if (!isNaN(value) && value > 0) {
      setRunningExpenses((prev) => prev + value);
      setTodaysExpenseInput('');
    }
  };

  // Called when you manually edit the “total” input and press Enter/blur
  const onTotalExpenseChange = (e) => {
    const newVal = parseFloat(e.target.value);
    if (!isNaN(newVal) && newVal >= 0) {
      setRunningExpenses(newVal);
    }
  };

  // ───────────────────────────────────────────────────────────────
  // 2. FETCH ERRANDS LIST (CSV → Array of Strings)
  // ───────────────────────────────────────────────────────────────

  const [allErrands, setAllErrands] = useState([]);
  const [errandsLoading, setErrandsLoading] = useState(true);

  useEffect(() => {
    fetch(
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKZsNiSRfGXyku4drmg7tLRX3AaHp2FsOdxajtt9NXjNUXFphfvwiBvgOv2J0F6z4i74Gz9aU968Vu/pub?output=csv'
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((csvText) => {
        const lines = csvText.trim().split('\n').filter((l) => l.trim());
        const dataLines = lines.slice(1); // skip header
        const parsed = dataLines.map((line) => {
          const firstComma = line.indexOf(',');
          if (firstComma === -1) return line.replace(/^"|"$/g, '');
          const idField = line.slice(0, firstComma).replace(/^"|"$/g, '');
          const nameField = line
            .slice(firstComma + 1)
            .replace(/^"|"$/g, '');
          return `${idField}. ${nameField}`;
        });
        setAllErrands(parsed);
        setErrandsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching errands CSV:', err);
        setAllErrands([]);
        setErrandsLoading(false);
      });
  }, []);

  // ───────────────────────────────────────────────────────────────
  // 3. ERRANDS CHOICES STATE (per schedule ID)
  // ───────────────────────────────────────────────────────────────

  const [errandsChoices, setErrandsChoices] = useState(() => {
    try {
      const stored = localStorage.getItem('dailyPlannerErrandsChoices');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Malformed errandsChoices in localStorage:', e);
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(
      'dailyPlannerErrandsChoices',
      JSON.stringify(errandsChoices)
    );
  }, [errandsChoices]);

  // ───────────────────────────────────────────────────────────────
  // 4. “DONE” CHECKBOXES STATE (per schedule ID)
  // ───────────────────────────────────────────────────────────────

  const [doneMap, setDoneMap] = useState(() => {
    try {
      const stored = localStorage.getItem('dailyPlannerDoneMap');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Malformed doneMap in localStorage:', e);
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem('dailyPlannerDoneMap', JSON.stringify(doneMap));
  }, [doneMap]);

// ──────────────────────────────────
// NEW: toggleDone sends an immediate “toggle” event to Apps Script
// ──────────────────────────────────
const toggleDone = (scheduleId) => {
  // 1) Flip local state so the UI updates immediately
  setDoneMap((prev) => {
    const newValue = !prev[scheduleId];
    const updated = { ...prev, [scheduleId]: newValue };

    // 2) POST this toggle event to Apps Script
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'toggle',          // tells Apps Script: this is a toggle event
        id: scheduleId,          // which schedule row was toggled
        newState: newValue,      // true if checked, false if unchecked
        timestamp: new Date().toISOString() // the exact UTC time of the click
      }),
    })
      .then((r) => r.json())
      .then((resp) => {
        console.log('Toggle event logged:', resp);
      })
      .catch((err) => {
        console.error('Error logging toggle event:', err);
      });

    return updated;
  });
};
  const totalRows = scheduleData.length;
  const completedCount = Object.values(doneMap).filter(Boolean).length;
  const completedPct =
    totalRows > 0
      ? ((completedCount / totalRows) * 100).toFixed(2)
      : '0.00';

  // ───────────────────────────────────────────────────────────────
  // 5. SHOPPING‐LIST FEATURES (per schedule ID)
  // ───────────────────────────────────────────────────────────────

  const [shoppingItemsMap, setShoppingItemsMap] = useState(() => {
    try {
      const stored = localStorage.getItem('dailyPlannerShopping');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Malformed shoppingItemsMap in localStorage:', e);
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(
      'dailyPlannerShopping',
      JSON.stringify(shoppingItemsMap)
    );
  }, [shoppingItemsMap]);

  const addShoppingItem = (rowId, text) => {
    if (!text.trim()) return;
    setShoppingItemsMap((prev) => {
      const prevList = prev[rowId] || [];
      return {
        ...prev,
        [rowId]: [...prevList, { text: text.trim(), done: false }],
      };
    });
  };

  const toggleShoppingItemDone = (rowId, idx) => {
    setShoppingItemsMap((prev) => {
      const prevList = prev[rowId] || [];
      const newList = prevList.map((item, j) =>
        j === idx ? { ...item, done: !item.done } : item
      );
      return { ...prev, [rowId]: newList };
    });
  };

  const deleteShoppingItem = (rowId, idx) => {
    setShoppingItemsMap((prev) => {
      const prevList = prev[rowId] || [];
      const newList = prevList.filter((_, j) => j !== idx);
      return { ...prev, [rowId]: newList };
    });
  };

  // ───────────────────────────────────────────────────────────────
  // 6. ERRANDPICKER MODAL CONTROLS
  // ───────────────────────────────────────────────────────────────

  const [modalOpenForId, setModalOpenForId] = useState(null);
  const [localModalChoices, setLocalModalChoices] = useState([]);

  const openErrandPicker = (scheduleId) => {
    const existing = Array.isArray(errandsChoices[scheduleId])
      ? errandsChoices[scheduleId]
      : [];
    setLocalModalChoices([...existing]);
    setModalOpenForId(scheduleId);
  };

  const closeErrandPicker = () => {
    setModalOpenForId(null);
    setLocalModalChoices([]);
  };

  const handleSaveErrands = (newChoices) => {
    if (modalOpenForId != null) {
      const categoryLower = scheduleData.find(
        (r) => r.id === modalOpenForId
      )?.category.toLowerCase();

      if (categoryLower === 'shopping') {
        // Convert to shopping‐list if ErrandPicker opened for “Shopping” by mistake:
        const arrObj = newChoices.map((text) => ({
          text,
          done: false,
        }));
        setShoppingItemsMap((prev) => ({
          ...prev,
          [modalOpenForId]: arrObj,
        }));
      } else {
        // Normal “Errands” slot
        setErrandsChoices((prev) => ({
          ...prev,
          [modalOpenForId]: [...newChoices],
        }));
      }
    }
    closeErrandPicker();
  };

  // ───────────────────────────────────────────────────────────────
  // 7. WHICH SHOPPING ROW IS “OPEN”?
  // ───────────────────────────────────────────────────────────────

  const [shoppingOpenForId, setShoppingOpenForId] = useState(null);

  // ───────────────────────────────────────────────────────────────
  // 8. ON‐LOAD EFFECT: DAILY + WEEKLY LOGGING & RESET
  // ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Yesterday’s string
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    // This week’s Sunday (weekEndingDate)
    const dayOfWeek = now.getDay(); // Sunday=0 … Saturday=6
    const sunday = new Date(now);
    sunday.setDate(sunday.getDate() - dayOfWeek);
    const thisWeekEnding = sunday.toISOString().slice(0, 10);

    // ——— DAILY LOG ———
    const lastDailyLog = localStorage.getItem('lastDailyLogDate');
    if (lastDailyLog !== todayStr) {
      const completedCountYesterday = Object.values(doneMap).filter(Boolean)
        .length;
      const totalCount = scheduleData.length;

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily',
          date: yesterdayStr,
          completedCount: completedCountYesterday,
          totalCount: totalCount,
          percent:
            totalCount > 0
              ? ((completedCountYesterday / totalCount) * 100).toFixed(2)
              : '0.00',
        }),
      })
        .then((r) => r.json())
        .then((resp) => {
          console.log('Daily log response:', resp);
          localStorage.setItem('lastDailyLogDate', todayStr);
          setDoneMap({});
          localStorage.removeItem('dailyPlannerDoneMap');
        })
        .catch((err) => {
          console.error('Error logging daily stats:', err);
          localStorage.setItem('lastDailyLogDate', todayStr);
          setDoneMap({});
          localStorage.removeItem('dailyPlannerDoneMap');
        });
    }

    // ——— WEEKLY LOG (ERRANDS + EXPENSES) ———
    const lastWeekLog = localStorage.getItem('lastWeekLogDate');
    if (lastWeekLog !== thisWeekEnding) {
      // Count errands completed last week
      const errandsCompletedLastWeek = Object.values(errandsChoices).flat()
        .length;

      // Capture the running expense total for the week
      const weeklyExpenseTotal = runningExpenses;

      // POST both errandsCompleted and expenseTotal
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly',
          weekEndingDate: thisWeekEnding,
          errandsCompleted: errandsCompletedLastWeek,
          expenseTotal: weeklyExpenseTotal,
        }),
      })
        .then((r) => r.json())
        .then((resp) => {
          console.log('Weekly log response:', resp);
          localStorage.setItem('lastWeekLogDate', thisWeekEnding);
          setErrandsChoices({});
          localStorage.removeItem('dailyPlannerErrandsChoices');

          // Reset running total at the start of a new week
          setRunningExpenses(0);
          localStorage.removeItem('dailyPlannerTotalExpenses');
        })
        .catch((err) => {
          console.error('Error logging weekly data:', err);
          localStorage.setItem('lastWeekLogDate', thisWeekEnding);
          setErrandsChoices({});
          localStorage.removeItem('dailyPlannerErrandsChoices');
          setRunningExpenses(0);
          localStorage.removeItem('dailyPlannerTotalExpenses');
        });
    }

    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────────────────────────
  // 9. If errands still loading, show “Loading errands…”
  // ───────────────────────────────────────────────────────────────
  if (errandsLoading) {
    return (
      <div className="schedule-container">
        <h1>Loading errands…</h1>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // 10. MAIN RENDER
  // ───────────────────────────────────────────────────────────────
  return (
    <div className="schedule-container">
      {/* ─── HEADER (Sticky) ─── */}
      <div className="header-frozen">
        <h1 className="main-title">My Daily Schedule</h1>
        <div className="date-line">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>

        {/* ── RUNNING‐TOTAL EXPENSES INPUT (editable) ── */}
        <div className="expenses-row">
          <label htmlFor="today-expense-input">
            Today’s New Expense (CHF):
          </label>
          <input
            id="today-expense-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={todaysExpenseInput}
            onChange={(e) => setTodaysExpenseInput(e.target.value)}
          />
          <button
            className="add-expense-btn"
            onClick={addTodaysExpense}
            style={{
              marginLeft: '0.5rem',
              padding: '0.4rem 0.8rem',
              backgroundColor: '#0077cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
          {/* Editable “total” field */}
          <input
            id="total-expense-input"
            type="number"
            step="0.01"
            min="0"
            value={runningExpenses.toFixed(2)}
            onChange={onTotalExpenseChange}
            style={{
              marginLeft: '1rem',
              fontWeight: '600',
              width: '6rem',
              textAlign: 'right',
            }}
          />
          <span style={{ marginLeft: '0.25rem', fontWeight: '600' }}>
            CHF
          </span>
        </div>

        {/* ── COMPLETED PERCENTAGE ── */}
        <div className="completed-line">
          Completed: {completedCount} / {totalRows} ({completedPct}%)
        </div>
      </div>

      {/* ─── SINGLE TABLE WITH STICKY HEADER ROW ─── */}
      <div className="table-body-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="col-done">Done</th>
              <th className="col-time">Time</th>
              <th className="col-activity">Activity</th>
              <th className="col-category">Category / Errand</th>
            </tr>
          </thead>
          <tbody>
            {scheduleData.map((item) => {
              const { id, start, end, activity, category } = item;
              const isErrandSlot = category.toLowerCase() === 'errands';
              const isShoppingSlot = category.toLowerCase() === 'shopping';
              const chosenErrands = errandsChoices[id] || [];
              const shoppingList = shoppingItemsMap[id] || [];

              // Build “remaining errands” for ErrandPicker
              const allOtherSelected = Object.entries(errandsChoices)
                .filter(
                  ([otherId]) =>
                    parseInt(otherId, 10) !== parseInt(id, 10)
                )
                .flatMap(([, arr]) => (Array.isArray(arr) ? arr : []));
              const errandsRemainingForThisSlot = allErrands.filter(
                (e) => !allOtherSelected.includes(e)
              );

              return (
                <React.Fragment key={id}>
                  <tr>
                    <td className="col-done">
                      <input
                        className="done-checkbox"
                        type="checkbox"
                        checked={!!doneMap[id]}
                        onChange={() => toggleDone(id)}
                      />
                    </td>
                    <td className="col-time">
                      {start} – {end}
                    </td>
                    <td className="col-activity">{activity}</td>
                    <td className="col-category">
                      {isErrandSlot ? (
                        <button
                          className="errand-display-btn"
                          onClick={() => openErrandPicker(id)}
                        >
                          {chosenErrands.length > 0
                            ? `${chosenErrands.length} selected`
                            : 'Choose an errand…'}
                        </button>
                      ) : isShoppingSlot ? (
                        <button
                          className="errand-display-btn shopping-btn"
                          onClick={() =>
                            setShoppingOpenForId((prev) =>
                              prev === id ? null : id
                            )
                          }
                        >
                          {shoppingOpenForId === id
                            ? 'Hide shopping'
                            : shoppingList.length > 0
                            ? `Edit shopping (${shoppingList.length} items)`
                            : 'Add shopping…'}
                        </button>
                      ) : (
                        category
                      )}
                    </td>
                  </tr>

                  {isShoppingSlot && shoppingOpenForId === id && (
                    <tr className="shopping-subrow">
                      <td colSpan="4">
                        <div className="shopping-editor">
                          <h4>Shopping List:</h4>
                          <ul className="shopping-list">
                            {shoppingList.map((itm, idx) => (
                              <li
                                key={idx}
                                className={
                                  itm.done
                                    ? 'shopping-item done'
                                    : 'shopping-item'
                                }
                              >
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={itm.done}
                                    onChange={() =>
                                      toggleShoppingItemDone(id, idx)
                                    }
                                  />{' '}
                                  {itm.text}
                                </label>
                                <button
                                  className="shopping-delete-btn"
                                  onClick={() =>
                                    deleteShoppingItem(id, idx)
                                  }
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                          <div className="shopping-add-row">
                            <input
                              id={`shopping-input-${id}`}
                              type="text"
                              placeholder="New item…"
                              className="shopping-add-input"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addShoppingItem(id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <button
                              className="shopping-add-btn"
                              onClick={() => {
                                const inputEl = document.querySelector(
                                  `#shopping-input-${id}`
                                );
                                if (inputEl) {
                                  addShoppingItem(id, inputEl.value);
                                  inputEl.value = '';
                                }
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {modalOpenForId === id && isErrandSlot && (
                    <ErrandPicker
                      isOpen={modalOpenForId !== null}
                      errandsRemaining={errandsRemainingForThisSlot}
                      currentChoices={chosenErrands}
                      onSelect={handleSaveErrands}
                      onClose={closeErrandPicker}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
