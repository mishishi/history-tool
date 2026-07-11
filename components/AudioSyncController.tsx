'use client';

/**
 * AudioSyncController — 包装 AudioPlayer + 段落高亮
 *
 * - 接 segments + slug
 * - 维护 activeSegmentId state
 * - 当 activeSeg 变化:scrollIntoView 对应 DOM + add class 高亮
 *
 * 配套:文章页段落需要 id="seg-{slug}-{segmentId}"
 *   excerpt / lead / s1 / s2 / s3 / ...
 */
import { useState, useEffect } from 'react';
import AudioPlayer, { type AudioSegment } from './AudioPlayer';

interface Props {
  src: string;
  title: string;
  voiceName?: string;
  durationLabel?: string;
  segments: AudioSegment[];
  slug: string;
}

const HIGHLIGHT_CLASS = 'audio-highlight';

export default function AudioSyncController({
  src,
  title,
  voiceName,
  durationLabel,
  segments,
  slug,
}: Props) {
  const [activeSeg, setActiveSeg] = useState<string | null>(null);

  useEffect(() => {
    // 清除旧高亮
    document
      .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
      .forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));

    if (!activeSeg) return;
    // 用 querySelector 找 data-segment-id(不用 getElementById 因为 h2 同时有 slug id)
    const el = document.querySelector(
      `[data-segment-id="seg-${slug}-${activeSeg}"]`,
    ) as HTMLElement | null;
    if (el) {
      el.classList.add(HIGHLIGHT_CLASS);
      // 滚动到视野中(只有离屏较远才滚,避免连续段切换一直抖)
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top >= 80 && rect.bottom <= window.innerHeight - 40;
      if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSeg, slug]);

  return (
    <AudioPlayer
      src={src}
      title={title}
      voiceName={voiceName}
      durationLabel={durationLabel}
      segments={segments}
      onSegmentChange={setActiveSeg}
    />
  );
}
