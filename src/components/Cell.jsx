import React from "react";

export default function Cell({ cell, onChange }) {
  const { value, fixed, status, blinking } = cell;

  const className = [
    "cell",
    fixed ? "cell-fixed" : "cell-editable",
    status === "correct" ? "cell-correct" : "",
    status === "incorrect" ? "cell-incorrect" : "",
    blinking ? "cell-blink" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {fixed ? (
        <span className="cell-label">{value}</span>
      ) : (
        <input
          className="cell-input"
          // inputMode "numeric" impediría escribir 'i'; lo dejamos como texto
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="?"
          aria-label="Número (real o a+bi)"
        />
      )}
    </div>
  );
}
