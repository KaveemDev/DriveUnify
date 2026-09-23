import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { FileIcon } from '../explorer/FileIcon';
import { formatFileSize, formatDateTime, getMimeLabel } from '../../utils/formatters';
import { openInGoogleDrive, isPreviewableImage, isPreviewableVideo, isGoogleAppsFile } from '../../utils/helpers';
import { useSelector } from 'react-redux';

export const FilePreviewModal = ({ file, files, onClose, onNavigate }) => {
  const { connectedAccounts } = useSelector((s) => s.drive);
  const getAccount = (email) => connectedAccounts?.find((a) => a.email === email);

  const currentIndex = files?.findIndex((f) => f.id === file?.id && f.accountEmail === file?.accountEmail) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < (files?.length || 0) - 1;

  // Custom Video Player Controls State
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate?.(files[currentIndex - 1]);
  }, [hasPrev, currentIndex, files, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate?.(files[currentIndex + 1]);
  }, [hasNext, currentIndex, files, onNavigate]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' && videoRef.current) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext, onClose]);

  if (!file) return null;

  const account = getAccount(file.accountEmail);
  const canPreviewImage = isPreviewableImage(file.mimeType);
  const canPreviewVideo = isPreviewableVideo(file.mimeType);
  const isGApp = isGoogleAppsFile(file.mimeType);
  const previewUrl = file.webViewLink;

  const handleDownload = () => {
    if (!account) return;
    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    fetch(url, { headers: { Authorization: `Bearer ${account.accessToken}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatVideoTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 5, 7, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          height: 'calc(100vh - 64px)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface, #111113)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated, #161618)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileIcon category={file.category} size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={file.name}
              >
                {file.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                {getMimeLabel(file.mimeType)} • {formatFileSize(file.size)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isGApp && (
              <button
                onClick={handleDownload}
                title="Download file"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-base)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              onClick={() => openInGoogleDrive(file)}
              title="Open in Google Drive"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-base)',
                color: 'var(--color-text-primary)',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Google Drive</span>
            </button>

            <button
              onClick={onClose}
              title="Close (Esc)"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Center Media Preview Canvas */}
        <div
          ref={videoContainerRef}
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#070709',
            overflow: 'hidden',
          }}
        >
          {canPreviewImage ? (
            <img
              src={`https://lh3.googleusercontent.com/d/${file.id}`}
              alt={file.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = file.thumbnailLink || '';
              }}
            />
          ) : canPreviewVideo ? (
            /* Premium 2026 Cinema Video Player */
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: '#000000',
              }}
            >
              <video
                ref={videoRef}
                src={`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100% - 60px)',
                  borderRadius: 6,
                  outline: 'none',
                }}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />

              {/* Cinema Control Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'calc(100% - 32px)',
                  maxWidth: 680,
                  background: 'rgba(17, 17, 19, 0.88)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  zIndex: 20,
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                {/* Play / Pause Button */}
                <button
                  onClick={togglePlay}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--color-accent, #3B82F6)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                </button>

                {/* Progress bar scrubber */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = next;
                    setCurrentTime(next);
                  }}
                  style={{
                    flex: 1,
                    height: 4,
                    accentColor: 'var(--color-accent, #3B82F6)',
                    cursor: 'pointer',
                  }}
                />

                {/* Timestamp */}
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </span>

                {/* Mute toggle */}
                <button
                  onClick={toggleMute}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.75)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {/* Fullscreen toggle */}
                <button
                  onClick={toggleFullscreen}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.75)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl.replace('/view', '/preview')}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="autoplay"
              title={file.name}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                textAlign: 'center',
                padding: '32px',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileIcon category={file.category} size={42} />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {getMimeLabel(file.mimeType)} • {formatFileSize(file.size)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {!isGApp && (
                  <button
                    onClick={handleDownload}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: 'var(--color-accent)',
                      color: 'var(--color-accent-fg)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                )}
                <button
                  onClick={() => openInGoogleDrive(file)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 7,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Open in Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              title="Previous file"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(22, 22, 24, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22, 22, 24, 0.95)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(22, 22, 24, 0.75)')}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {hasNext && (
            <button
              onClick={handleNext}
              title="Next file"
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(22, 22, 24, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(22, 22, 24, 0.95)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(22, 22, 24, 0.75)')}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated, #161618)',
            fontSize: '0.72rem',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          <div>Modified: {formatDateTime(file.modifiedTime)}</div>
          <div>Account: {file.accountEmail}</div>
          {files?.length > 1 && (
            <div>
              {currentIndex + 1} of {files.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
