'use client';

/**
 * AudioPlayer — 文章音频朗读播放器
 *
 * MVP 范围:
 * - HTML5 <audio> + 自定义控件(播放/暂停 + 进度条 + 时间)
 * - 段落同步:监听 audio.currentTime,匹配 segments 输出 currentSegmentId
 *   文章页接收 onSegmentChange 回调,高亮对应 DOM 段落
 * - 埋点: tts_play / tts_pause / tts_complete (Vercel Analytics)
 *   通过 lib/analytics.ts 集中调用
 *
 * 数据依赖:
 * - public/audios/{slug}.mp3
 * - lib/audio-timestamps/{slug}.json (segments 数组)
 *   TTS 流程:scripts/generate-audios.mjs + generate-timestamps.mjs
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { track } from '@/lib/analytics';

export interface AudioSegment {
  id: string;
  startSec: number;
  endSec: number;
  charCount: number;
}

interface Props {
  src: string;
  title: string;
  voiceName?: string;
  durationLabel?: string;
  segments?: AudioSegment[]; // 段落时间戳 — 传了就启用段落同步
  onSegmentChange?: (id: string | null) => void; // 当前段变更回调
}

export default function AudioPlayer({
  src,
  title,
  voiceName = '青涩青年音色',
  durationLabel,
  segments,
  onSegmentChange,
}: Props) {
  // 用 useState 替代 useRef — setAudioEl 触发 re-render,
  // useEffect 依赖 audioEl 才能正确在 audio 元素 mount 后绑 listener
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const lastSegIdRef = useRef<string | null>(null);

  // 根据 currentTime 找当前段
  const findSegment = useCallback(
    (t: number): string | null => {
      if (!segments) return null;
      for (const seg of segments) {
        if (t >= seg.startSec && t < seg.endSec) return seg.id;
      }
      if (segments.length > 0 && t >= segments[segments.length - 1].endSec) {
        return segments[segments.length - 1].id;
      }
      return null;
    },
    [segments],
  );

  useEffect(() => {
    if (!audioEl) return;
    const audio = audioEl;

    // 每次 audioEl 重新创建(切歌)时, 同步当前调速设置
    audio.playbackRate = playbackRate;

    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      if (onSegmentChange) {
        const newId = findSegment(t);
        if (newId !== lastSegIdRef.current) {
          lastSegIdRef.current = newId;
          onSegmentChange(newId);
        }
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (onSegmentChange) onSegmentChange(null);
      // 完播埋点 — 真正读完一篇文章的强信号
      const slug = audio.src.replace(/^.*\/audios\//, '').replace(/\.mp3$/, '');
      track('tts_complete', { slug, totalSec: Math.round(audio.duration) });
    };
    const onErr = () => setError('音频加载失败');

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onErr);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onErr);
    };
  }, [audioEl, findSegment, onSegmentChange]);

  // 调速变化时, 同步到 audioEl.playbackRate
  // (用户切歌时用上面的 useEffect 重置)
  useEffect(() => {
    if (audioEl) audioEl.playbackRate = playbackRate;
  }, [playbackRate, audioEl]);

  const toggle = () => {
    if (!audioEl) return;
    // 从 src 解析 slug(/audios/<slug>.mp3 → slug)
    const slug = src.replace(/^\/audios\//, '').replace(/\.mp3$/, '');
    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
      track('tts_pause', { slug, elapsedSec: Math.round(audioEl.currentTime) });
    } else {
      audioEl.play().catch(() => setError('播放失败,请重试'));
      setIsPlaying(true);
      track('tts_play', { slug, durationSec: Math.round(audioEl.duration) });
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioEl) return;
    const t = Number(e.target.value);
    audioEl.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 当前段(用于进度条下方段标)
  const currentSeg = segments && lastSegIdRef.current
    ? segments.find((s) => s.id === lastSegIdRef.current)
    : null;

  if (error) {
    return (
      <div className="my-6 p-3 bg-paper-card border border-border rounded-sm text-xs text-ink-mute">
        🎧 音频暂不可用 ({error})
      </div>
    );
  }

  return (
    <div className="my-6 p-4 md:p-5 bg-gradient-to-br from-paper-card to-paper-deep border border-border rounded-sm shadow-sm">
      <audio ref={setAudioEl} src={src} preload="metadata" />

      <div className="flex items-center gap-3 md:gap-4">
        {/* 播放/暂停按钮 */}
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? '暂停' : '播放'}
          className="shrink-0 w-11 h-11 flex items-center justify-center bg-cinnabar hover:bg-cinnabar-dark text-paper rounded-full transition-all hover:shadow-md active:scale-95"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 标题 + 进度条 + 时间 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div className="text-xs font-medium text-ink truncate">{title}</div>
            <div className="text-[10px] text-ink-mute tabular-nums shrink-0">
              {fmt(currentTime)} / {fmt(duration)}
            </div>
          </div>

          {/* 进度条 */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={onSeek}
            disabled={!duration}
            className="w-full h-1 bg-paper-deep rounded-full appearance-none cursor-pointer disabled:opacity-50
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cinnabar [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cinnabar [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #B23A3A 0%, #B23A3A ${pct}%, #E8DCC4 ${pct}%, #E8DCC4 100%)`,
            }}
            aria-label="音频进度"
          />

          {/* 段标小点(在进度条下方) — 仅当有 segments */}
          {segments && segments.length > 0 && duration > 0 && (
            <div className="relative h-1.5 mt-0.5">
              {segments.map((seg) => {
                const leftPct = (seg.startSec / duration) * 100;
                const isActive = currentSeg?.id === seg.id;
                return (
                  <span
                    key={seg.id}
                    className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all ${
                      isActive ? 'bg-cinnabar scale-150' : 'bg-ink-mute/40'
                    }`}
                    style={{ left: `${leftPct}%` }}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          )}

          {/* meta 行 */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-ink-mute">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              {voiceName}
            </span>
            {durationLabel && duration > 60 && (
              <>
                <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                <span>{durationLabel}</span>
              </>
            )}
            {currentSeg && (
              <>
                <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                <span className="text-cinnabar">朗读中:{currentSeg.id}</span>
              </>
            )}
          </div>
        </div>

        {/* 调速按钮 — 4 档(0.75x/1.0x/1.25x/1.5x) */}
        <div
          className="shrink-0 flex items-center bg-paper-deep rounded-full p-0.5 text-[10px] font-medium"
          role="group"
          aria-label="调速"
        >
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                setPlaybackRate(rate);
                track('tts_speed_change', { rate });
              }}
              aria-pressed={playbackRate === rate}
              aria-label={`调速 ${rate}x`}
              className={`px-2 py-1 rounded-full transition-colors tabular-nums ${
                playbackRate === rate
                  ? 'bg-cinnabar text-paper'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
