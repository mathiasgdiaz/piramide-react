import React from "react";
import Cell from "./Cell";

export default function Pyramid({ puzzle, onChangeCell }) {
  const { cells } = puzzle;

  return (
    <div className="pyramid">
      {cells.map((row, r) => (
        <div className="pyramid-row" key={r}>
          {row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              cell={cell}
              onChange={(val) => onChangeCell(r, c, val)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
