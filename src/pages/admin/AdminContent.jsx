import React, { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminContent() {
  const [videos, setVideos] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [newVideo, setNewVideo] = useState({ title: '', adNetwork: 'admob', adUnitId: '', durationInSeconds: 30 });
  const [newCampaign, setNewCampaign] = useState({
    sponsorName: '', videoUrl: '', durationInSeconds: 30,
    campaignBudget: 100, payoutPerView: 0.05,
    startDate: '', endDate: '',
  });

  useEffect(() => { load(); }, []);

  function load() {
    client.get('/admin/videos').then((res) => setVideos(res.data.videos));
    client.get('/admin/sponsored-content').then((res) => setCampaigns(res.data.campaigns));
  }

  async function addVideo(e) {
    e.preventDefault();
    await client.post('/admin/videos', newVideo);
    setNewVideo({ title: '', adNetwork: 'admob', adUnitId: '', durationInSeconds: 30 });
    load();
  }

  async function addCampaign(e) {
    e.preventDefault();
    await client.post('/admin/sponsored-content', newCampaign);
    load();
  }

  return (
    <div className="container">
      <h1>Videos & Campaigns</h1>

      <h3>Ad-network placement slots</h3>
      <form onSubmit={addVideo} className="card">
        <input placeholder="Title" value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} required />
        <select value={newVideo.adNetwork} onChange={(e) => setNewVideo({ ...newVideo, adNetwork: e.target.value })}>
          <option value="admob">AdMob</option>
          <option value="unity_ads">Unity Ads</option>
        </select>
        <input placeholder="Ad Unit ID" value={newVideo.adUnitId} onChange={(e) => setNewVideo({ ...newVideo, adUnitId: e.target.value })} required />
        <input type="number" placeholder="Duration (s)" value={newVideo.durationInSeconds} onChange={(e) => setNewVideo({ ...newVideo, durationInSeconds: +e.target.value })} />
        <button className="btn" type="submit">Add slot</button>
      </form>
      <table>
        <thead><tr><th>Title</th><th>Network</th><th>Active</th></tr></thead>
        <tbody>{videos.map((v) => <tr key={v._id}><td>{v.title}</td><td>{v.adNetwork}</td><td>{v.isActive ? 'Yes' : 'No'}</td></tr>)}</tbody>
      </table>

      <h3>Sponsored campaigns</h3>
      <form onSubmit={addCampaign} className="card">
        <input placeholder="Sponsor name" value={newCampaign.sponsorName} onChange={(e) => setNewCampaign({ ...newCampaign, sponsorName: e.target.value })} required />
        <input placeholder="Video URL" value={newCampaign.videoUrl} onChange={(e) => setNewCampaign({ ...newCampaign, videoUrl: e.target.value })} required />
        <input type="number" placeholder="Budget" value={newCampaign.campaignBudget} onChange={(e) => setNewCampaign({ ...newCampaign, campaignBudget: +e.target.value })} />
        <input type="number" step="0.01" placeholder="Payout per view" value={newCampaign.payoutPerView} onChange={(e) => setNewCampaign({ ...newCampaign, payoutPerView: +e.target.value })} />
        <input type="date" value={newCampaign.startDate} onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })} required />
        <input type="date" value={newCampaign.endDate} onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })} required />
        <button className="btn" type="submit">Add campaign</button>
      </form>
      <table>
        <thead><tr><th>Sponsor</th><th>Spent/Budget</th><th>Active</th></tr></thead>
        <tbody>{campaigns.map((c) => <tr key={c._id}><td>{c.sponsorName}</td><td>${c.campaignSpent.toFixed(2)} / ${c.campaignBudget.toFixed(2)}</td><td>{c.isActive ? 'Yes' : 'No'}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
