import React, { useEffect, useState } from "react";
import client from "../../api/client";

const initialSlot = {
  title: "",
  adNetwork: "admob",
  adUnitId: "",
  durationInSeconds: 30,
};
const initialCampaign = {
  sponsorName: "",
  videoUrl: "",
  durationInSeconds: 30,
  campaignBudget: 100,
  payoutPerView: 0.05,
  startDate: "",
  endDate: "",
};
const initialUpload = { title: "", durationInSeconds: 30, rewardAmount: 0.05 };

export default function AdminContent() {
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [newSlot, setNewSlot] = useState(initialSlot);
  const [newCampaign, setNewCampaign] = useState(initialCampaign);
  const [uploadDetails, setUploadDetails] = useState(initialUpload);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [videoResponse, campaignResponse] = await Promise.all([
        client.get("/admin/videos"),
        client.get("/admin/sponsored-content"),
      ]);
      setVideos(videoResponse.data.videos || []);
      setCampaigns(campaignResponse.data.campaigns || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not load content. Check the admin API and retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  async function uploadVideo(event) {
    event.preventDefault();
    clearFeedback();
    if (!uploadFile) {
      setError("Choose a video file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("video", uploadFile);
    formData.append("title", uploadDetails.title);
    formData.append(
      "durationInSeconds",
      String(uploadDetails.durationInSeconds),
    );
    formData.append("rewardAmount", String(uploadDetails.rewardAmount));
    setSaving(true);
    try {
      await client.post("/admin/videos/upload", formData);
      setUploadDetails(initialUpload);
      setUploadFile(null);
      setMessage("Video uploaded and added to the content library.");
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Video upload failed. Confirm the upload API is available.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addSlot(event) {
    event.preventDefault();
    clearFeedback();
    setSaving(true);
    try {
      await client.post("/admin/videos", newSlot);
      setNewSlot(initialSlot);
      setMessage("Ad placement created.");
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not create this ad placement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addCampaign(event) {
    event.preventDefault();
    clearFeedback();
    setSaving(true);
    try {
      await client.post("/admin/campaigns", newCampaign);
      setNewCampaign(initialCampaign);
      setMessage("Sponsored campaign created.");
      await load();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not create this sponsored campaign.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVideo(video) {
    clearFeedback();
    try {
      await client.patch(`/admin/videos/${video._id}`, {
        isActive: !video.isActive,
      });
      setMessage(`Video ${video.isActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this video.");
    }
  }

  async function toggleCampaign(campaign) {
    clearFeedback();
    try {
      await client.patch(`/admin/campaigns/${campaign._id}`, {
        isActive: !campaign.isActive,
      });
      setMessage(
        `Campaign ${campaign.isActive ? "deactivated" : "activated"}.`,
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this campaign.");
    }
  }

  return (
    <div className="container admin-content-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">LIBRARY & MONETIZATION</p>
          <h2>Video content</h2>
          <p>
            Upload reward videos, configure placements, and manage sponsored
            campaigns.
          </p>
        </div>
        <span className="admin-count">
          {videos.length} videos · {campaigns.length} campaigns
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

      <section className="admin-section admin-upload-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">REWARD VIDEO</span>
            <h3>Upload a video</h3>
          </div>
        </div>
        <form
          className="admin-form-grid admin-video-upload-form"
          onSubmit={uploadVideo}
        >
          <label className="admin-field admin-field-wide">
            <span>Video title</span>
            <input
              value={uploadDetails.title}
              onChange={(event) =>
                setUploadDetails({
                  ...uploadDetails,
                  title: event.target.value,
                })
              }
              required
            />
          </label>
          <label className="admin-field">
            <span>Video file</span>
            <input
              className="admin-file-input"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(event) =>
                setUploadFile(event.target.files?.[0] || null)
              }
              required
            />
          </label>
          <label className="admin-field">
            <span>Duration (seconds)</span>
            <input
              type="number"
              min="1"
              value={uploadDetails.durationInSeconds}
              onChange={(event) =>
                setUploadDetails({
                  ...uploadDetails,
                  durationInSeconds: Number(event.target.value),
                })
              }
              required
            />
          </label>
          <label className="admin-field">
            <span>Reward per completion ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={uploadDetails.rewardAmount}
              onChange={(event) =>
                setUploadDetails({
                  ...uploadDetails,
                  rewardAmount: Number(event.target.value),
                })
              }
              required
            />
          </label>
          <button
            className="admin-primary-action"
            type="submit"
            disabled={saving}
          >
            {saving ? "Uploading..." : "Upload video"}
          </button>
        </form>
        {uploadFile && (
          <p className="admin-file-selected">
            Selected: {uploadFile.name} ·{" "}
            {(uploadFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}
      </section>

      <section className="admin-section admin-library-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">CONTENT LIBRARY</span>
            <h3>Videos and placements</h3>
          </div>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    Loading content...
                  </td>
                </tr>
              ) : videos.length ? (
                videos.map((video) => (
                  <tr key={video._id}>
                    <td>{video.title || "Untitled video"}</td>
                    <td>{video.adNetwork || "Reward video"}</td>
                    <td>{video.durationInSeconds || "—"} sec</td>
                    <td>
                      <span
                        className={`admin-status ${video.isActive ? "status-active" : "status-blocked"}`}
                      >
                        {video.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-row-action"
                        type="button"
                        onClick={() => toggleVideo(video)}
                      >
                        {video.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    No videos have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-content-forms">
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">AD NETWORK</span>
              <h3>Placement slot</h3>
            </div>
          </div>
          <form className="admin-form-grid" onSubmit={addSlot}>
            <label className="admin-field admin-field-wide">
              <span>Title</span>
              <input
                value={newSlot.title}
                onChange={(event) =>
                  setNewSlot({ ...newSlot, title: event.target.value })
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>Network</span>
              <select
                value={newSlot.adNetwork}
                onChange={(event) =>
                  setNewSlot({ ...newSlot, adNetwork: event.target.value })
                }
              >
                <option value="admob">AdMob</option>
                <option value="unity_ads">Unity Ads</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Ad unit ID</span>
              <input
                value={newSlot.adUnitId}
                onChange={(event) =>
                  setNewSlot({ ...newSlot, adUnitId: event.target.value })
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>Duration (seconds)</span>
              <input
                type="number"
                min="1"
                value={newSlot.durationInSeconds}
                onChange={(event) =>
                  setNewSlot({
                    ...newSlot,
                    durationInSeconds: Number(event.target.value),
                  })
                }
              />
            </label>
            <button
              className="admin-primary-action"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add placement"}
            </button>
          </form>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-eyebrow">SPONSORED CONTENT</span>
              <h3>New campaign</h3>
            </div>
          </div>
          <form className="admin-form-grid" onSubmit={addCampaign}>
            <label className="admin-field">
              <span>Sponsor name</span>
              <input
                value={newCampaign.sponsorName}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    sponsorName: event.target.value,
                  })
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>Hosted video URL</span>
              <input
                type="url"
                value={newCampaign.videoUrl}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    videoUrl: event.target.value,
                  })
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>Campaign budget ($)</span>
              <input
                type="number"
                min="0"
                value={newCampaign.campaignBudget}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    campaignBudget: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="admin-field">
              <span>Payout per view ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newCampaign.payoutPerView}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    payoutPerView: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="admin-field">
              <span>Start date</span>
              <input
                type="date"
                value={newCampaign.startDate}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    startDate: event.target.value,
                  })
                }
                required
              />
            </label>
            <label className="admin-field">
              <span>End date</span>
              <input
                type="date"
                value={newCampaign.endDate}
                onChange={(event) =>
                  setNewCampaign({
                    ...newCampaign,
                    endDate: event.target.value,
                  })
                }
                required
              />
            </label>
            <button
              className="admin-primary-action"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Create campaign"}
            </button>
          </form>
        </section>
      </div>

      <section className="admin-section admin-library-section">
        <div className="admin-section-heading">
          <div>
            <span className="admin-eyebrow">SPONSOR INVENTORY</span>
            <h3>Campaigns</h3>
          </div>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Sponsor</th>
                <th>Spent / budget</th>
                <th>Flight dates</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length ? (
                campaigns.map((campaign) => (
                  <tr key={campaign._id}>
                    <td>{campaign.sponsorName}</td>
                    <td>
                      ${Number(campaign.campaignSpent || 0).toFixed(2)} / $
                      {Number(campaign.campaignBudget || 0).toFixed(2)}
                    </td>
                    <td>
                      {campaign.startDate
                        ? new Date(campaign.startDate).toLocaleDateString()
                        : "—"}{" "}
                      –{" "}
                      {campaign.endDate
                        ? new Date(campaign.endDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`admin-status ${campaign.isActive ? "status-active" : "status-blocked"}`}
                      >
                        {campaign.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-row-action"
                        type="button"
                        onClick={() => toggleCampaign(campaign)}
                      >
                        {campaign.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="admin-table-empty">
                    No campaigns have been added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
