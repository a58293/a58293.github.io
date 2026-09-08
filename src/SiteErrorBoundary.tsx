import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class SiteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LUMEN AURALIS page render failed', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="not-found-page site-error-page" role="alert">
      <p>暂时未能展开这一卷</p>
      <h1>页面加载遇到了一点问题</h1>
      <p>你可以重新载入页面；若仍未恢复，请稍后再试。</p>
      <div className="site-error-actions">
        <button type="button" onClick={() => window.location.reload()}>重新载入</button>
        <a href="/">返回品牌首页 ↗</a>
      </div>
    </main>;
  }
}
