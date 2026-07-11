'use client';

/**
 * AudioPlayer — 文章音频朗读播放器
 *
 * MVP 范围:
 * - HTML5 <audio> + 自定义控件(播放/暂停 + 进度条 + 时间)
 * - 浮动卡片(在 article hero 下方)
 * - 不做段落同步(下一版,需要音频 + 文字对齐时间戳)
 *
 * 数据依赖:public/audios/{slug}.mp3
 * TTS 流程:scripts/generate-audios.mjs 跑 matrix_synthesize_speech
 */
import { useState, useRef, useEffect } from 'react';

interface Props {
  src: string;
  title: string;
  voiceName?: string;
  durationLabel?: string; // 预估时长(从 readingTime 算,如 "~5 分钟")
}

export default function AudioPlayer({ src, title, voiceName = '青涩青年音色', durationLabel }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
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
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setError('播放失败,请重试'));
      setIsPlaying(true);
    }
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="my-6 p-3 bg-paper-card border border-border rounded-sm text-xs text-ink-mute">
        🎧 音频暂不可用 ({error})
      </div>
    );
  }

  return (
    <div className="my-6 p-4 md:p-5 bg-gradient-to-br from-paper-card to-paper-deep border border-border rounded-sm shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />

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

          {/* 进度条(input range + 自定义样式) */}
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

          {/* meta 行 */}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-ink-mute">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              {voiceName}
            </span>
            {/* 时长标签只在音频超过 60s 时显示(避免 prototype 短音频显示"约 10 分钟"的误导) */}
            {durationLabel && duration > 60 && (
              <>
                <span className="w-1 h-1 rounded-full bg-ink-mute"></span>
                <span>{durationLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
