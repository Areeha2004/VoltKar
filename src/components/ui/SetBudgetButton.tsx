// components/SetBudgetButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function SetBudgetButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/settings")}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#0070f3",
        color: "white",
        border: "none",
        padding: "0.75rem 1.5rem",
        borderRadius: "50px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
      }}
    >
      ⚡ Set Budget
    </button>
  );
}
