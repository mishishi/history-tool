'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** 目标数字 */
  to: number;
  /** 动画时长 (ms) */
  duration?: number;
  /** 起始数字,默认 0 */
  from?: number;
  /** 前缀,如 "1," */
  prefix?: string;
  /** 后缀,如 "年"、"篇" */
  suffix?: string;
  /** className for wrapper */
  className?: string;
  /** 是否用 locale 格式化(千分位) */
  locale?: boolean;
  /** 减震 */
  respectReducedMotion?: boolean;
}

/**
 * 数字增长动画
 * - IntersectionObserver 触发,进入视口时开始从 from 涨到 to
 * - easeOutExpo 缓动,1.5s
 * - prefers-reduced-motion 时直接显示 target
 * - 用于首页/About 的 "50 篇 / 1362 年 / 1 人+AI" 等统计
 */
export default function CountUp({
  to,
  duration = 1500,
  from = 0,
  prefix = '',
  suffix = '',
  className = '',
  locale = true,
  respectReducedMotion = true,
}: Props) {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    // 减震偏好:直接显示 target
    if (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }

    const animate = () => {
      if (animatedRef.current) return;
      animatedRef.current = true;
      const start = performance.now();
      const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        setValue(Math.round(from + (to - from) * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    // 已在视口内就立即触发,否则 IntersectionObserver 监听
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animate();
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animate();
            observer.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [to, duration, from, respectReducedMotion]);

  const formatted = locale ? value.toLocaleString('zh-CN') : value.toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}