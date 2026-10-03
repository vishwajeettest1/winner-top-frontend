import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiMail, FiPhone, FiBookOpen } from "react-icons/fi";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const faqs = [
  {
    question: "How do I register and start earning?",
    answer:
      "Create your account with your mobile number and email address, then complete the starter activation and begin watching eligible videos. Rewards are credited only after a full video completion.",
  },
  {
    question: "How many videos can I watch in a day?",
    answer:
      "You can watch up to 10 rewarded videos per day. Once the daily limit is reached, the app blocks further rewarded watch actions until the next day.",
  },
  {
    question: "When does my wallet balance update?",
    answer:
      "Your wallet balance updates immediately after a video is completed and the reward is successfully credited. Video reward history is on the Watch page, referral activity is on the Invite page, and withdrawal requests are on the Withdraw page.",
  },
  {
    question: "How do referrals work?",
    answer:
      "Use your secure referral link from the Invite page. When someone joins using your code, their activity can contribute to referral earnings and status entries are shown under the referral activity section.",
  },
  {
    question: "How do withdrawals work?",
    answer:
      "Submit a withdrawal request from the Withdraw page. The app shows the 7-day withdrawal window, the remaining countdown, and the expected payout date.",
  },
  {
    question: "What if I need support?",
    answer:
      "Contact our customer support directly from this Help Center using the support option below. We are here to help with account, wallet, referral, video, and withdrawal issues.",
  },
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="client-page help-page">
      <ClientPageHeader
        eyebrow="HELP CENTER"
        title="Support & FAQs"
        description="Find answers about registrations, video rewards, wallet updates, referrals, and withdrawals."
      />
      <div className="help-page-links">
        <Link to="/about" className="help-about-link">
          <FiBookOpen aria-hidden="true" />
          <span>About StreamEarn</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <section className="help-support-card" aria-label="Support contact">
        <div className="help-support-heading">
          <div>
            <span className="client-page-eyebrow">DIRECT SUPPORT</span>
            <h2>We are here to help.</h2>
            <p>Reach out about your account, rewards, referrals, or payout.</p>
          </div>
          <span className="help-support-mark" aria-hidden="true">
            ?
          </span>
        </div>

        <div className="help-contact-actions">
          <a href="tel:+18005550199">
            <span className="help-contact-icon" aria-hidden="true">
              <FiPhone />
            </span>
            <span>
              <small>CALL SUPPORT</small>
              <strong>+1 (800) 555-0199</strong>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
          <a href="mailto:help@streamearn.app">
            <span className="help-contact-icon" aria-hidden="true">
              <FiMail />
            </span>
            <span>
              <small>EMAIL SUPPORT</small>
              <strong>help@streamearn.app</strong>
            </span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section
        className="client-section"
        aria-label="Frequently asked questions"
      >
        <div className="client-section-heading">
          <h2>FAQs</h2>
          <span>{faqs.length} answers</span>
        </div>

        <div className="help-faq-list">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <article
                className={`help-faq-item ${isOpen ? "is-open" : ""}`}
                key={item.question}
              >
                <button
                  className="help-faq-question"
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span className="help-faq-number">0{index + 1}</span>
                  <strong>{item.question}</strong>
                  <FiChevronDown aria-hidden="true" />
                </button>
                <div className="help-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
