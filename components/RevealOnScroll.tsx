'use client';

import { useEffect } from 'react';

/**
 * 滚动驱动的「入场动画」触发器
 * - 监听 .prose-article 内的所有 h3
 * - 进入视口时加 .reveal-in class,触发 CSS 过渡
 * - 一次性触发(进入后不再变回)
 */
export default function RevealOnScroll() {
  useEffect(() => {
    const article = document.querySelector('.prose-article');
    if (!article) return;
    const headings = article.querySelectorAll('h3');
    if (headings.length === 0) return;

    // 减震偏好:直接显示,不隐藏不动画
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      headings.forEach((h) => h.classList.add('reveal-in'));
      return;
    }

    // 初始:所有 h3 都是隐藏状态(由 CSS 默认 opacity: 0)
    headings.forEach((h) => h.classList.add('reveal-pending'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            entry.target.classList.remove('reveal-pending');
            observer.unobserve(entry.target); // 一次性
          }
        });
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1,
      }
    );
    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, []);

  return null;
}