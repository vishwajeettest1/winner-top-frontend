import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const platformFeatures = [
  {
    title: "Video rewards",
    description:
      "Watch eligible videos in full and follow daily progress from one place.",
  },
  {
    title: "Wallet tracking",
    description:
      "Review video rewards, referral earnings, and your available balance.",
  },
  {
    title: "Referrals",
    description:
      "Share your invite link and keep track of referral activity and status.",
  },
  {
    title: "Withdrawals",
    description:
      "Submit a request and see its withdrawal window and expected date.",
  },
];

const aboutContent = {
  mission:
    "Make digital rewards easier to follow by keeping video activity, referrals, and wallet updates in one clear experience.",
  vision:
    "Build a trusted rewards platform where people can understand each earning step and see their account activity clearly.",
  story:
    "StreamEarn began with the idea that watching, inviting, and tracking rewards should feel connected rather than scattered. The platform brings those activities together with wallet records, daily progress, and withdrawal information.",
  team: [
    {
      name: "Founder name",
      role: "Founder",
      initials: "F",
      bio: "Add the founder's approved background, expertise, and experience.",
    },
    {
      name: "Team member name",
      role: "Product and engineering",
      initials: "T",
      bio: "Add an approved team biography and relevant experience.",
    },
    {
      name: "Team member name",
      role: "Community and support",
      initials: "T",
      bio: "Add an approved team biography and relevant experience.",
    },
    {
      name: "Team member name",
      role: "Operations and compliance",
      initials: "T",
      bio: "Add an approved team biography and relevant experience.",
    },
  ],
  achievements: [
    { label: "Community members", value: "Add verified total" },
    { label: "Successful withdrawals", value: "Add verified total" },
    { label: "Notable milestone", value: "Add milestone and date" },
  ],
  supportEmail: "help@streamearn.app",
  supportPhone: "+1 (800) 555-0199",
  socialProfiles: [
    { name: "Instagram", Icon: FaInstagram, url: "https://instagram.com" },
    { name: "Facebook", Icon: FaFacebookF, url: "https://facebook.com" },
    { name: "YouTube", Icon: FaYoutube, url: "https://youtube.com" },
    { name: "Twitter", Icon: FaTwitter, url: "https://twitter.com" },
  ],
};

export default function AboutUs() {
  return (
    <main className="client-page about-page">
      <ClientPageHeader
        eyebrow="ABOUT STREAM EARN"
        title="Rewards with a clearer path."
        description="StreamEarn brings video rewards, referrals, and wallet activity together in one straightforward experience."
      />
      <p className="about-draft-notice about-reveal" role="note">
        Draft content: replace the sample team, achievement, and contact fields
        with verified company information before launch.
      </p>

      <section
        className="about-purpose about-reveal"
        aria-labelledby="about-mission-title"
      >
        <div>
          <span className="client-page-eyebrow">OUR MISSION</span>
          <h2 id="about-mission-title">A clearer rewards experience.</h2>
          <p>{aboutContent.mission}</p>
        </div>
        <div className="about-vision">
          <span className="client-page-eyebrow">OUR VISION</span>
          <p>{aboutContent.vision}</p>
        </div>
      </section>

      <section
        className="client-section about-offerings about-reveal"
        aria-label="What the platform offers"
      >
        <div className="client-section-heading">
          <h2>What you can do</h2>
          <span>On the platform</span>
        </div>
        <div className="about-feature-list">
          {platformFeatures.map((feature, index) => (
            <article className="about-feature" key={feature.title}>
              <span className="about-feature-index" aria-hidden="true">
                0{index + 1}
              </span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="about-story about-reveal"
        aria-labelledby="about-story-title"
      >
        <span className="client-page-eyebrow">OUR STORY</span>
        <h2 id="about-story-title">One home for the earning journey.</h2>
        <p>{aboutContent.story}</p>
      </section>

      <section
        className="client-section about-platform-facts about-reveal"
        aria-label="Platform facts"
      >
        <div className="client-section-heading">
          <h2>Platform at a glance</h2>
          <span>Current product rules</span>
        </div>
        <div className="about-facts">
          <article>
            <strong>10</strong>
            <span>daily rewarded video limit</span>
          </article>
          <article>
            <strong>7 days</strong>
            <span>withdrawal window shown in the app</span>
          </article>
          <article>
            <strong>2</strong>
            <span>reward categories tracked: video and referral</span>
          </article>
        </div>
        <p className="about-data-note">
          These are product rules, not user or success statistics. Verified
          community totals are not currently published.
        </p>
      </section>

      <section
        className="about-people about-reveal"
        aria-labelledby="about-people-title"
      >
        <span className="client-page-eyebrow">THE PEOPLE BEHIND IT</span>
        <h2 id="about-people-title">Founder and team</h2>
        <div className="about-team-list">
          {aboutContent.team.map((member, index) => (
            <article
              className="about-team-member"
              key={`${member.role}-${index}`}
            >
              <span className="about-team-avatar" aria-hidden="true">
                {member.initials}
              </span>
              <div>
                <h3>{member.name}</h3>
                <span className="about-team-role">{member.role}</span>
                <p>{member.bio}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="about-data-note">
          Names, biographies, and photos above are temporary placeholders.
        </p>
      </section>

      <section
        className="client-section about-achievements about-reveal"
        aria-label="Achievements and statistics"
      >
        <div className="client-section-heading">
          <h2>Achievements &amp; statistics</h2>
          <span>Replace with verified data</span>
        </div>
        <div className="about-achievement-list">
          {aboutContent.achievements.map((achievement) => (
            <article className="about-achievement" key={achievement.label}>
              <strong>{achievement.value}</strong>
              <span>{achievement.label}</span>
            </article>
          ))}
        </div>
        <p className="about-data-note">
          No audience or success figures are claimed until verified totals are
          available.
        </p>
      </section>

      <section
        className="about-contact about-reveal"
        aria-labelledby="about-contact-title"
      >
        <div className="about-contact-head">
          <div>
            <span className="client-page-eyebrow">GET IN TOUCH</span>
            <h2 id="about-contact-title">Need a hand?</h2>
            <p>Reach our team directly or find an answer in the Help Center.</p>
          </div>
          <span className="about-contact-mark" aria-hidden="true">
            ✳
          </span>
        </div>
        <div className="about-contact-methods">
          <a
            className="about-contact-method"
            href={`mailto:${aboutContent.supportEmail}`}
          >
            <span className="about-contact-method-icon" aria-hidden="true">
              @
            </span>
            <span className="about-contact-method-copy">
              <small>EMAIL SUPPORT</small>
              <strong>{aboutContent.supportEmail}</strong>
            </span>
            <span className="about-contact-method-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <a className="about-contact-method" href="tel:+18005550199">
            <span className="about-contact-method-icon" aria-hidden="true">
              ☎
            </span>
            <span className="about-contact-method-copy">
              <small>CALL SUPPORT</small>
              <strong>{aboutContent.supportPhone}</strong>
            </span>
            <span className="about-contact-method-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
        <Link to="/help" className="about-contact-link">
          <span className="about-help-icon" aria-hidden="true">
            ?
          </span>
          <span className="about-help-copy">
            <strong>Browse the Help Center</strong>
            <small>FAQs, account help, and earning information</small>
          </span>
          <span className="about-help-arrow" aria-hidden="true">
            →
          </span>
        </Link>
        <p className="about-data-note">
          Temporary support contact details: confirm or replace before launch.
        </p>
        <div className="about-social-list" aria-label="Social media profiles">
          {aboutContent.socialProfiles.map(({ name, Icon, url }) => {
            const content = (
              <>
                <span className="about-social-icon-circle" aria-hidden="true">
                  <Icon className="about-social-icon" />
                </span>
                <span className="about-social-copy">
                  <strong>{name}</strong>
                  <small>Visit {name}</small>
                </span>
                <span className="about-social-arrow" aria-hidden="true">
                  ↗
                </span>
              </>
            );

            return (
              <a
                className="about-social-placeholder"
                href={url}
                key={name}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${name}`}
              >
                {content}
              </a>
            );
          })}
        </div>
        <p className="about-data-note">
          These links open each social network. Official StreamEarn profile
          links can replace them when available.
        </p>
      </section>
    </main>
  );
}
