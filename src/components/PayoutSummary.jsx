import React from "react";
import { FiCreditCard, FiSmartphone } from "react-icons/fi";

export default function PayoutSummary({ method, details }) {
  const rows =
    method === "UPI"
      ? [
          ["Name", details?.name],
          ["UPI ID", details?.upiId],
        ]
      : [
          ["Account holder", details?.accountHolderName],
          ["Bank name", details?.bankName],
          ["Account number", details?.accountNumber],
          ["IFSC / routing code", details?.routingCode],
        ];

  return (
    <div className="payout-summary">
      <div className="payout-summary-method">
        {method === "UPI" ? (
          <FiSmartphone aria-hidden="true" />
        ) : (
          <FiCreditCard aria-hidden="true" />
        )}
        <strong>{method === "UPI" ? "UPI" : "Bank transfer"}</strong>
      </div>
      {rows.map(([label, value]) => (
        <label className="admin-field" key={label}>
          <span>{label}</span>
          <input value={value || ""} disabled readOnly />
        </label>
      ))}
    </div>
  );
}
