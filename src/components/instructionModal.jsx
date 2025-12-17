import React from "react";
import "./InstructionModal.css";

export default function InstructionModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="instruction-modal-backdrop" onClick={onClose}>
      <div
        className="instruction-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>¿Cómo se juega?</h2>

        <p className="desc">
          Cada número de arriba se obtiene sumando los dos de abajo.<br />
          Y si conocés un número de arriba y uno de abajo, podés obtener el otro <b>restando</b>.
        </p>

        <div className="example-container">
          {/* ---  MINI PIRÁMIDE --- */}
          <div className="mini-pyramid">
            <div className="mini-row">
              <div className="mini-node highlight-parent">8</div>
            </div>

            <div className="mini-row">
              <div className="mini-node highlight-child-left">5</div>
              <div className="mini-node highlight-child-right">3</div>
            </div>
          </div>

          <p className="explanation">
            Ejemplo:<br />
            <span className="sum">5 + 3 = 8</span><br />
            Si conocés <b>8</b> y <b>5</b>:  
            <span className="resta">8 - 5 = 3</span>
          </p>
        </div>

        <button className="close-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
