// app/settings/page.tsx (Next.js 13+ App Router example)
// or pages/settings.tsx (Next.js Pages Router)
"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [budget, setBudget] = useState<number | "">("");
  const [status, setStatus] = useState<string>("");

  // Load budget from localStorage on mount
  useEffect(() => {
    const storedBudget = localStorage.getItem("monthlyBudgetKwh");
    if (storedBudget) {
      setBudget(Number(storedBudget));
    }
  }, []);

  // Save budget to localStorage
  const saveBudget = () => {
    if (budget && Number(budget) > 0) {
      localStorage.setItem("monthlyBudgetKwh", String(budget));
      setStatus("Budget saved successfully!");
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Please enter a valid number.");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "2rem" }}>
      <h1>⚡ Energy Settings</h1>
      <label htmlFor="budget" style={{ display: "block", marginTop: "1rem" }}>
        Monthly Energy Budget (kWh)
      </label>
      <input
        id="budget"
        type="number"
        value={budget}
        onChange={(e) =>
          setBudget(e.target.value === "" ? "" : Number(e.target.value))
        }
        style={{
          padding: "0.5rem",
          width: "100%",
          marginTop: "0.5rem",
          marginBottom: "1rem",
        }}
      />
      <button
        onClick={saveBudget}
        style={{
          padding: "0.5rem 1rem",
          background: "#0070f3",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        Save Budget
      </button>
      {status && (
        <p style={{ marginTop: "1rem", color: status.includes("saved") ? "green" : "red" }}>
          {status}
        </p>
      )}
    </div>
  );
}
