import { Component } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import { ThemeProvider } from '@toss/tds-mobile'
import IntroPage from './pages/IntroPage'
import WritePage from './pages/WritePage'
import StatsPage from './pages/StatsPage'
import RewritePage from './pages/RewritePage'
import './App.css'

// [DEBUG] 런타임 에러를 포착하여 화면에 표시하는 컴포넌트
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  componentDidCatch(e: Error, info: unknown) {
    console.error("Caught error:", e, info);
    // 에러 발생 시 알림창을 띄워 어떤 에러인지 즉시 확인
    alert(`[React Error]\n${e.message}\n\n${e.stack?.slice(0, 300)}`)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff', height: '100vh', overflow: 'auto' }}>
          <h2>에러가 발생했습니다</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()}>새로고침</button>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const routes = (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/write" element={<WritePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/rewrite" element={<RewritePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )

  return (
    <ErrorBoundary>
      <TDSMobileAITProvider>{routes}</TDSMobileAITProvider>
    </ErrorBoundary>
  )
}

export default App
