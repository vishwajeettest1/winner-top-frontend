import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const CATEGORIES = ["ACCOUNT", "WALLET", "REFERRAL", "VIDEO", "WITHDRAWAL", "OTHER"];
const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
];
const EMPTY_FORM = { subject: "", message: "", category: "OTHER" };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const HelpContact = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await client.get("/user/contact-requests");
        setQuestions(response.data.requests || response.data.contactRequests || []);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
        setError("Failed to load your tickets. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Subject and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await client.post("/user/contact-request", formData);
      setQuestions((prev) => [response.data.contactRequest, ...prev]);
      setFormData(EMPTY_FORM);
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("Failed to submit question:", err);
      setError(
        err.response?.status === 429
          ? "Too many requests. Please wait before submitting again."
          : "Failed to submit question. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return questions
      .filter((q) => statusFilter === "ALL" || q.status === statusFilter)
      .filter(
        (q) =>
          !term ||
          q.subject.toLowerCase().includes(term) ||
          q.message.toLowerCase().includes(term) ||
          q.category.toLowerCase().includes(term)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [questions, statusFilter, searchTerm]);

  const counts = {
    ALL: questions.length,
    OPEN: questions.filter((q) => q.status === "OPEN").length,
    IN_PROGRESS: questions.filter((q) => q.status === "IN_PROGRESS").length,
    RESOLVED: questions.filter((q) => q.status === "RESOLVED").length,
  };

  const openModal = () => {
    setError(null);
    setShowModal(true);
  };

  return (
    <main className="client-page hc-page">
      <ClientPageHeader
        eyebrow="SUPPORT TICKETS"
        title="My Support Tickets"
        description="Ask questions and get help from our support team"
      />

      <div className="hc-actions">
        <Link to="/help" className="help-contact-back">
          <FiArrowLeft aria-hidden="true" />
          <span>Help Center</span>
        </Link>
        <button type="button" className="hc-new-btn" onClick={openModal}>
          <FiPlus aria-hidden="true" />
          <span>New ticket</span>
        </button>
      </div>

      <div className="hc-stats" role="tablist" aria-label="Filter tickets by status">
        {STATUS_TABS.map((tab, index) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab.key}
            className={`hc-stat ${statusFilter === tab.key ? "is-active" : ""}`}
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => setStatusFilter(tab.key)}
          >
            <strong>{counts[tab.key]}</strong>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <label className="hc-search">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          placeholder="Search your tickets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search tickets"
        />
      </label>

      {error && !showModal && (
        <div className="hc-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <FiX size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="hc-list">
          <div className="hc-skeleton" />
          <div className="hc-skeleton" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="hc-empty">
          <span className="hc-empty-icon">
            <FiMessageSquare aria-hidden="true" />
          </span>
          <h3>No tickets found</h3>
          <p>
            {searchTerm || statusFilter !== "ALL"
              ? "Try a different search or filter."
              : "Have a question? Raise a ticket and our team will answer it."}
          </p>
          {!searchTerm && statusFilter === "ALL" && (
            <button type="button" className="hc-new-btn" onClick={openModal}>
              <FiPlus aria-hidden="true" />
              <span>Create your first ticket</span>
            </button>
          )}
        </div>
      ) : (
        <div className="hc-list">
          {filteredQuestions.map((question, index) => (
            <article
              key={question._id}
              className={`hc-card is-${String(question.status).toLowerCase()}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="hc-card-top">
                <div className="hc-tags">
                  <span className="hc-tag">{question.category}</span>
                  <span className="hc-status">
                    {String(question.status).replace("_", " ")}
                  </span>
                </div>
                <span className="hc-date">{formatDate(question.createdAt)}</span>
              </div>

              <div>
                <h3 className="hc-subject">{question.subject}</h3>
                <p className="hc-message">{question.message}</p>
              </div>

              {question.adminReply ? (
                <div className="hc-reply">
                  <div className="hc-reply-label">
                    <FiCheckCircle aria-hidden="true" /> Support reply
                  </div>
                  <p>{question.adminReply}</p>
                  {question.repliedAt && (
                    <small>Replied {formatDate(question.repliedAt)}</small>
                  )}
                </div>
              ) : (
                <div className="hc-waiting">
                  <FiClock aria-hidden="true" /> Waiting for a reply from support
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="hc-overlay"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="hc-sheet" role="dialog" aria-modal="true" aria-labelledby="hc-sheet-title">
            <div className="hc-sheet-head">
              <div>
                <h2 id="hc-sheet-title">New support ticket</h2>
                <p>Tell us what you need help with.</p>
              </div>
              <button type="button" className="hc-close" onClick={closeModal} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitQuestion} className="hc-form">
              <div className="hc-field">
                <label>Category</label>
                <div className="hc-chips">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`hc-chip ${formData.category === category ? "is-active" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, category }))}
                    >
                      {category.charAt(0) + category.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hc-field">
                <label htmlFor="hc-subject">Subject</label>
                <input
                  id="hc-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Short summary of your question"
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              <div className="hc-field">
                <label htmlFor="hc-message">Message</label>
                <textarea
                  id="hc-message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your issue in detail..."
                  maxLength={1000}
                />
                <span className="hc-counter">{formData.message.length}/1000</span>
              </div>

              {error && (
                <div className="hc-error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="hc-form-actions">
                <button type="button" className="hc-btn hc-btn-ghost" onClick={closeModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="hc-btn hc-btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default HelpContact;
