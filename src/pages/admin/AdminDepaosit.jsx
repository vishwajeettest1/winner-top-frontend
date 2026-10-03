import React, { useEffect, useState } from "react";
import { FiImage, FiRefreshCw, FiUpload } from "react-icons/fi";
import client from "../../api/client";

const MAX_QR_SIZE = 5 * 1024 * 1024;

export default function AdminDepaosit() {
  const [options, setOptions] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectingId, setSelectingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!qrFile) {
      setQrPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(qrFile);
    setQrPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [qrFile]);

  async function loadOptions() {
    setLoading(true);
    try {
      const response = await client.get("/admin/deposit-options");
      setOptions(response.data.options || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not load deposit options. Check that the admin deposit API is available.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  async function addOption(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !qrFile ||
      !["image/png", "image/jpeg", "image/webp"].includes(qrFile.type)
    ) {
      setError("Choose a PNG, JPEG, or WebP QR code image.");
      return;
    }
    if (qrFile.size > MAX_QR_SIZE) {
      setError("QR code image must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("displayName", displayName.trim());
    formData.append("upiId", upiId.trim());
    formData.append("qrCode", qrFile);

    setSaving(true);
    try {
      await client.post("/admin/deposit-options", formData);
      setDisplayName("");
      setUpiId("");
      setQrFile(null);
      setMessage("Deposit option added.");
      await loadOptions();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not add this deposit option. Check the admin deposit API.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function selectOption(option) {
    const optionId = option._id || option.id;
    if (!optionId || option.isActive) return;

    setSelectingId(optionId);
    setError("");
    setMessage("");
    try {
      await client.patch(`/admin/deposit-options/${optionId}/active`, {
        isActive: true,
      });
      setMessage(`${option.displayName} is now the active deposit option.`);
      await loadOptions();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          "Could not change the active deposit option.",
      );
    } finally {
      setSelectingId(null);
    }
  }

  const activeOption = options.find((option) => option.isActive);

  return (
    <div className="container admin-deposit-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">PAYMENT CONFIGURATION</p>
          <h2>Deposit options</h2>
          <p>
            Add UPI payment details and choose the single option shown to
            customers.
          </p>
        </div>
        <span className="admin-count">
          {activeOption ? "1 active option" : "No active option"}
        </span>
      </div>

      {error && (
        <div className="admin-notice admin-notice-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="admin-notice admin-notice-success" role="status">
          {message}
        </div>
      )}

      <section className="admin-section admin-deposit-form-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">NEW PAYMENT METHOD</span>
            <h3>Add UPI option</h3>
          </div>
        </div>
        <form
          className="admin-form-grid admin-deposit-form"
          onSubmit={addOption}
        >
          <label className="admin-field">
            <span>Option name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Main UPI"
              maxLength={60}
              required
            />
          </label>
          <label className="admin-field">
            <span>UPI ID</span>
            <input
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="payments@examplebank"
              maxLength={120}
              required
            />
          </label>
          <label className="admin-field admin-field-wide">
            <span>QR code image</span>
            <input
              className="admin-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setQrFile(event.target.files?.[0] || null)}
              required
            />
            <small className="admin-field-hint">Image only, up to 5 MB.</small>
          </label>
          {qrPreview && (
            <div className="admin-qr-preview">
              <img src={qrPreview} alt="Preview of uploaded UPI QR code" />
              <span>
                <FiImage aria-hidden="true" /> QR preview
              </span>
            </div>
          )}
          <button
            className="admin-primary-action"
            type="submit"
            disabled={saving}
          >
            <FiUpload aria-hidden="true" />
            {saving ? "Adding option..." : "Add deposit option"}
          </button>
        </form>
      </section>

      <section className="admin-section admin-deposit-table-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">AVAILABLE METHODS</span>
            <h3>UPI options</h3>
          </div>
          <button
            className="admin-refresh"
            type="button"
            onClick={loadOptions}
            disabled={loading}
            aria-label="Refresh deposit options"
          >
            <FiRefreshCw aria-hidden="true" /> Refresh
          </button>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table admin-deposit-table">
            <thead>
              <tr>
                <th scope="col">Select</th>
                <th scope="col">Option</th>
                <th scope="col">UPI ID</th>
                <th scope="col">QR code</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    Loading deposit options...
                  </td>
                </tr>
              ) : options.length ? (
                options.map((option) => {
                  const optionId = option._id || option.id;
                  return (
                    <tr key={optionId}>
                      <td>
                        <input
                          className="admin-deposit-radio"
                          type="radio"
                          name="active-deposit-option"
                          value={optionId}
                          checked={Boolean(option.isActive)}
                          onChange={() => selectOption(option)}
                          disabled={saving || selectingId !== null}
                          aria-label={`Select ${option.displayName} as the active deposit option`}
                        />
                      </td>
                      <td>{option.displayName}</td>
                      <td>{option.upiId}</td>
                      <td>
                        {option.qrCodeUrl ? (
                          <a
                            className="admin-qr-link"
                            href={option.qrCodeUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={option.qrCodeUrl}
                              alt={`${option.displayName} QR code`}
                            />
                            View QR
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span
                          className={`admin-status ${option.isActive ? "status-active" : "status-blocked"}`}
                        >
                          {option.isActive
                            ? "Active"
                            : selectingId === optionId
                              ? "Updating..."
                              : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    No deposit options yet. Add a UPI ID and QR code above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="admin-deposit-note">
          Selecting an option makes it the only active UPI deposit method. The
          server must enforce this rule when saving the selection.
        </p>
      </section>
    </div>
  );
}
