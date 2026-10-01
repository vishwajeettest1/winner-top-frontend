import React, { useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";
import ClientPageHeader from "../components/ClientPageHeader.jsx";

const REQUIRED_VIDEO_COUNT = 10;
const MAX_VIDEO_COUNT = 12;
const SAMPLE_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const FALLBACK_VIDEOS = Array.from(
  { length: REQUIRED_VIDEO_COUNT },
  (_, index) => ({
    sourceType: index % 2 === 0 ? "sponsored" : "ad_network",
    sourceId: `fallback-video-${index + 1}`,
    title: `Reward video ${index + 1}`,
    durationInSeconds: 30 + (index % 5) * 10,
    videoUrl: SAMPLE_VIDEO_URL,
  }),
);

function getVideoKey(video) {
  return `${video.sourceType}-${video.sourceId}`;
}

function normalizeVideos(apiVideos = []) {
  const merged = [...(Array.isArray(apiVideos) ? apiVideos : [])];

  for (const fallbackVideo of FALLBACK_VIDEOS) {
    const exists = merged.some(
      (video) => getVideoKey(video) === getVideoKey(fallbackVideo),
    );
    if (!exists) {
      merged.push(fallbackVideo);
    }
  }

  while (merged.length < REQUIRED_VIDEO_COUNT) {
    const next = FALLBACK_VIDEOS[merged.length % FALLBACK_VIDEOS.length];
    if (!merged.some((video) => getVideoKey(video) === getVideoKey(next))) {
      merged.push(next);
    }
  }

  return merged.slice(0, MAX_VIDEO_COUNT);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyCompletedCount() {
  const today = getTodayKey();
  const savedDay = localStorage.getItem("streamearn_daily_watch_day");
  const savedCount = Number(
    localStorage.getItem("streamearn_daily_watch_count") || 0,
  );

  if (savedDay !== today) {
    localStorage.setItem("streamearn_daily_watch_day", today);
    localStorage.setItem("streamearn_daily_watch_count", "0");
    return 0;
  }

  return Number.isFinite(savedCount) ? savedCount : 0;
}

function getDailyCompletedVideos() {
  if (localStorage.getItem("streamearn_daily_watch_day") !== getTodayKey()) {
    return {};
  }

  try {
    return JSON.parse(
      localStorage.getItem("streamearn_daily_completed_videos") || "{}",
    );
  } catch {
    return {};
  }
}

export default function VideoPlayer() {
  const [videos, setVideos] = useState(FALLBACK_VIDEOS);
  const [cap, setCap] = useState(REQUIRED_VIDEO_COUNT);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [completedVideos, setCompletedVideos] = useState(() =>
    getDailyCompletedVideos(),
  );
  const [dailyCompletedCount, setDailyCompletedCount] = useState(() =>
    getDailyCompletedCount(),
  );
  const videoRef = useRef(null);
  const creditingVideoKeys = useRef(new Set());

  useEffect(() => {
    loadVideos();
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedVideo || !videoRef.current) return;

    const node = videoRef.current;
    node.currentTime = 0;
    node.load();
    node.play().catch(() => undefined);
  }, [selectedVideo]);

  useEffect(() => {
    localStorage.setItem(
      "streamearn_daily_watch_count",
      String(dailyCompletedCount),
    );
    localStorage.setItem("streamearn_daily_watch_day", getTodayKey());
  }, [dailyCompletedCount]);

  useEffect(() => {
    localStorage.setItem(
      "streamearn_daily_completed_videos",
      JSON.stringify(completedVideos),
    );
  }, [completedVideos]);

  async function loadVideos() {
    setLoading(true);
    try {
      const res = await client.get("/videos/daily");
      const normalized = normalizeVideos(res.data.videos);
      const completedToday = Number(
        res.data.videosCompletedToday || getDailyCompletedCount() || 0,
      );
      setVideos(normalized);
      setCap(Number(res.data.dailyRewardCap || REQUIRED_VIDEO_COUNT));
      setDailyCompletedCount(completedToday);
    } catch (error) {
      setVideos(FALLBACK_VIDEOS);
      setCap(REQUIRED_VIDEO_COUNT);
    } finally {
      setLoading(false);
    }
  }

  const completedVideoKeys = useMemo(
    () =>
      new Set(
        Object.keys(completedVideos).filter((key) => completedVideos[key]),
      ),
    [completedVideos],
  );

  async function creditReward(video) {
    const key = getVideoKey(video);
    if (
      completedVideoKeys.has(key) ||
      creditingVideoKeys.current.has(key) ||
      dailyCompletedCount >= cap
    )
      return;

    creditingVideoKeys.current.add(key);
    setCompletedVideos((prev) => ({ ...prev, [key]: true }));
    setMessage("");

    try {
      const res = await client.post("/videos/complete", {
        sourceType: video.sourceType,
        sourceId: video.sourceId,
        watchedDurationSeconds: Number(video.durationInSeconds || 30),
      });

      const nextCount = dailyCompletedCount + 1;
      setDailyCompletedCount(nextCount);
      window.dispatchEvent(new CustomEvent("wallet:updated"));

      setMessage(
        `Video completed. Earned $${res.data.userShare.toFixed(4)}. ${Math.max(cap - nextCount, 0)} left today.`,
      );
    } catch (err) {
      setCompletedVideos((prev) => ({ ...prev, [key]: false }));
      setMessage(err.response?.data?.error || "Could not credit reward");
    } finally {
      creditingVideoKeys.current.delete(key);
    }
  }

  function handleVideoProgress() {
    const node = videoRef.current;
    const activeVideo = selectedVideo;

    if (!node || !activeVideo) return;

    const duration = Number(
      node.duration || activeVideo.durationInSeconds || 30,
    );
    const nextProgress = duration
      ? Math.min((node.currentTime / duration) * 100, 100)
      : 0;
    setWatchProgress(nextProgress);

    if (node.currentTime >= duration - 0.25) {
      creditReward(activeVideo);
    }
  }

  function handleSelectVideo(video) {
    if (dailyCompletedCount >= cap) {
      setMessage(
        `Daily watch limit reached. You have completed ${cap}/${cap} videos today.`,
      );
      return;
    }

    setSelectedVideo(video);
    setWatchProgress(0);
    setMessage("");
  }

  if (loading) {
    return (
      <main className="client-page">
        <ClientPageHeader
          eyebrow="DAILY REWARDS"
          title="Watch & earn"
          description="Choose a video and collect rewards as you watch."
        />
        <div className="client-empty">Finding today's videos…</div>
      </main>
    );
  }

  return (
    <main className="client-page watch-page">
      <ClientPageHeader
        eyebrow="DAILY REWARDS"
        title="Watch & earn"
        description={`Up to ${cap} rewarded videos per day. Complete each full video to receive credit.`}
      />
      <section
        className="watch-progress-card"
        aria-label="Daily progress summary"
      >
        <div className="client-section-heading">
          <h2>Daily progress</h2>
          <span>
            {dailyCompletedCount}/{cap}
          </span>
        </div>
        <div className="watch-progress-copy">
          <strong>
            {dailyCompletedCount >= cap
              ? "Daily limit reached"
              : `${cap - dailyCompletedCount} videos left today`}
          </strong>
          <span>{Math.round((dailyCompletedCount / cap) * 100)}% complete</span>
        </div>
        <div className="watch-progress-track" aria-hidden="true">
          <span
            style={{
              width: `${Math.min((dailyCompletedCount / cap) * 100, 100)}%`,
            }}
          />
        </div>
      </section>
      {message && (
        <div className="client-feedback" role="status">
          {message}
        </div>
      )}

      {selectedVideo && (
        <section
          className="client-section"
          aria-label="Current video watch session"
        >
          <div className="client-section-heading">
            <h2>Now watching</h2>
            <span>{Math.round(watchProgress)}%</span>
          </div>

          <div className="watch-current-card">
            <video
              ref={videoRef}
              src={selectedVideo.videoUrl || SAMPLE_VIDEO_URL}
              controls
              playsInline
              preload="metadata"
              onTimeUpdate={handleVideoProgress}
              onEnded={() => creditReward(selectedVideo)}
              className="watch-current-video"
            />

            <div className="watch-current-copy">
              <h3>{selectedVideo.title}</h3>
              <p>
                {selectedVideo.durationInSeconds}s <span>·</span>{" "}
                {selectedVideo.sourceType === "sponsored"
                  ? "Sponsored"
                  : "Ad network"}
              </p>
            </div>

            <div className="watch-current-status">
              <strong
                className={
                  completedVideoKeys.has(getVideoKey(selectedVideo))
                    ? "is-complete"
                    : ""
                }
              >
                {completedVideoKeys.has(getVideoKey(selectedVideo))
                  ? "Reward credited after full watch"
                  : "Watch to the end to unlock reward"}
              </strong>
              <span>{Math.round(watchProgress)}%</span>
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 ? (
        <section className="client-section" aria-label="Available videos">
          <div className="client-section-heading">
            <h2>Available today</h2>
            <span>{videos.length} videos</span>
          </div>
          <div className="watch-list">
            {videos.map((video) => {
              const key = getVideoKey(video);
              const isCompleted = Boolean(completedVideos[key]);

              return (
                <article
                  className={`watch-item ${isCompleted ? "is-completed" : ""}`}
                  key={key}
                >
                  <span className="watch-play" aria-hidden="true">
                    {isCompleted ? "✓" : "▶"}
                  </span>
                  <div className="watch-item-copy">
                    <h3>{video.title}</h3>
                    <p>
                      {video.durationInSeconds}s <span>·</span>{" "}
                      {video.sourceType === "sponsored"
                        ? "Sponsored"
                        : "Ad network"}
                    </p>
                  </div>
                  <span className="watch-item-reward">REWARD</span>
                  <button
                    className={`watch-claim ${isCompleted ? "is-watched" : ""}`}
                    onClick={() => handleSelectVideo(video)}
                    disabled={isCompleted || dailyCompletedCount >= cap}
                    style={{
                      opacity:
                        isCompleted || dailyCompletedCount >= cap ? 0.6 : 1,
                    }}
                  >
                    {isCompleted
                      ? "Watched"
                      : dailyCompletedCount >= cap
                        ? "Limit reached"
                        : "Watch"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="client-empty">
          <span aria-hidden="true">✳</span>
          <strong>You're all caught up</strong>
          <p>
            No videos are available right now. Check back later for more
            rewards.
          </p>
        </div>
      )}
    </main>
  );
}
