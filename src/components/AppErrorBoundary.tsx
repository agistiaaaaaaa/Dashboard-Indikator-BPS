import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Top-level recovery UI when an unexpected render error occurs.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("AppErrorBoundary", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page-body" style={{ padding: "3rem 1.5rem" }}>
          <div className="state-box state-error" role="alert">
            <p className="state-title">Terjadi kesalahan pada antarmuka.</p>
            <p className="state-desc">
              Muat ulang halaman. Jika masalah berlanjut, pastikan API lokal
              berjalan lalu coba lagi.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Muat ulang
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
