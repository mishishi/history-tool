'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 模块名 — 兜底 UI 显示,如「AI 问典」「快捷键面板」 */
  name: string;
  /** 自定义兜底 UI,不传则用默认 */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * 组件级 ErrorBoundary
 * - 跟 app/error.tsx 路由级 catch 互补:模块内部抛错,不会污染整页
 * - 一个组件挂了,其他组件照常工作(Header / Footer / 主体内容都还在)
 * - 失败时显示「这模块出错了」兜底 + 重试按钮
 *
 * 使用场景:包有 fetch / DOM 操作 / localStorage 依赖的 client components
 *   <SectionErrorBoundary name="AI 问典"><AskChat /></SectionErrorBoundary>
 *
 * 设计:
 * - 必须用 class component(React 限制:ErrorBoundary 必须是 class)
 * - 重试用 key 切换或 setState — 这里用 setState 简单
 * - 默认 fallback 简洁:朱红软背景 + 印章 + 模块名 + 描述 + 重试按钮
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // 生产环境可以接 Sentry 等监控;这里先 console
    // 组件名用 [dt-section-error:<name>] 前缀,便于排查
    // eslint-disable-next-line no-console
    console.error(`[dt-section-error:${this.props.name}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback name={this.props.name} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({
  name,
  onRetry,
}: {
  name: string;
  onRetry: () => void;
}) {
  // fixed 浮在视口左下角 — 不占文档流,不影响主体阅读
  // 多个 boundary 同时挂掉时会堆叠(用 key 区分顺序)
  return (
    <div
      role="alert"
      className="fixed left-4 md:left-6 bottom-[10rem] z-[70] max-w-sm p-3 bg-cinnabar-soft border border-cinnabar/30 rounded-sm text-sm shadow-lg fade-in-up"
    >
      <div className="flex items-start gap-3">
        {/* 朱红印章 */}
        <span className="seal shrink-0 mt-0.5">障</span>
        <div className="flex-1 min-w-0">
          <div className="text-cinnabar-dark font-medium mb-1 leading-snug">
            「{name}」出了点问题
          </div>
          <div className="text-xs text-ink-soft leading-relaxed mb-2">
            已经把它收起,不影响你读正文或其他功能。
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="text-xs px-2.5 py-1 bg-paper border border-cinnabar/40 text-cinnabar hover:bg-cinnabar hover:text-paper rounded-sm transition-colors font-medium"
            >
              重试
            </button>
            <span className="text-[10px] text-ink-mute">
              （失败会继续显示）
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
