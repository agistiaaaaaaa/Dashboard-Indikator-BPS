import { useId, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { isDevelopmentAuthMode, safeWorkspaceReturnPath, useAuth } from "../auth";

export function LoginPage() {
  const { ready, authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formId = useId();
  const errorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ username: false, password: false });

  const from = safeWorkspaceReturnPath(
    (location.state as { from?: string } | null)?.from
  );

  if (ready && authenticated) {
    return <Navigate to={from} replace />;
  }

  const usernameInvalid = touched.username && !username.trim();
  const passwordInvalid = touched.password && !password;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (!username.trim() || !password) {
      setError("Lengkapi username dan kata sandi.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await login({
        username: username.trim(),
        password,
      });
      if (!result.success) {
        setError(
          result.error || "Username atau kata sandi tidak sesuai."
        );
        setPassword("");
        return;
      }
      navigate(from, { replace: true });
    } catch {
      setError("Tidak dapat masuk saat ini. Coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-stage">
        <aside className="login-aside" aria-hidden="true">
          <img src="/landing/hero-lombok.png" alt="" className="login-aside-img" />
          <div className="login-aside-scrim" />
          <div className="login-aside-copy">
            <p className="eyebrow">BPS Kabupaten Lombok Tengah</p>
            <p className="login-aside-title">
              Ruang kerja data
              <br />
              strategis
            </p>
            <p className="login-aside-text">
              Kelola pemutakhiran indikator secara terpusat untuk mendukung
              pembangunan daerah.
            </p>
          </div>
        </aside>

        <main className="login-main">
          <div className="login-card">
            <Link to="/" className="login-brand">
              <img
                src="/branding/bps-logo.svg"
                alt=""
                width={44}
                height={44}
              />
              <span>
                <strong>Badan Pusat Statistik</strong>
                <em>Kabupaten Lombok Tengah</em>
              </span>
            </Link>

            <h1 id={`${formId}-title`}>Masuk ke Ruang Kerja</h1>
            <p className="login-lede">
              Gunakan akun internal (lokal/staging) untuk memutakhirkan dan
              meninjau data indikator. Integrasi SSO BPS belum tersedia pada
              versi ini.
            </p>

            {isDevelopmentAuthMode() ? (
              <p className="login-dev-banner" role="note">
                Mode pengembangan: autentikasi mock. Bukan keamanan produksi.
              </p>
            ) : null}

            <form
              className="login-form"
              onSubmit={onSubmit}
              noValidate
              aria-labelledby={`${formId}-title`}
            >
              <div className="field">
                <label className="field-label" htmlFor={`${formId}-username`}>
                  Username / Email
                </label>
                <input
                  id={`${formId}-username`}
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  disabled={submitting}
                  aria-invalid={usernameInvalid || undefined}
                  aria-describedby={error ? errorId : undefined}
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor={`${formId}-password`}>
                  Kata sandi
                </label>
                <div className="password-field">
                  <input
                    id={`${formId}-password`}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    disabled={submitting}
                    aria-invalid={passwordInvalid || undefined}
                    aria-describedby={error ? errorId : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? "Sembunyi" : "Tampil"}
                  </button>
                </div>
              </div>

              {error ? (
                <p id={errorId} className="login-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={submitting}
                aria-busy={submitting || undefined}
              >
                {submitting ? "Memproses…" : "Masuk"}
              </button>
            </form>

            <p className="login-back">
              <Link to="/">Kembali ke beranda publik</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
