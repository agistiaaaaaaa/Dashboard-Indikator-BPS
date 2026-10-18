import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ROLE_LABELS,
  getWorkspaceNavForRole,
  isDevelopmentAuthMode,
  isLocalApiAuthMode,
  useAuth,
} from "../../auth";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "../../workspace/UnsavedChangesContext";

function WorkspaceShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDirty, requestLeave } = useUnsavedChanges();

  if (!user) return null;

  const nav = getWorkspaceNavForRole(user.role);

  function onLogout() {
    requestLeave(() => {
      void (async () => {
        await logout();
        navigate("/login", { replace: true });
      })();
    });
  }

  return (
    <div className="workspace">
      <header className="workspace-topbar">
        <div className="workspace-topbar-inner">
          <div className="workspace-brand">
            <img
              src="/branding/bps-logo.svg"
              alt=""
              width={36}
              height={36}
            />
            <div>
              <p className="workspace-brand-kicker">Ruang Kerja Internal</p>
              <p className="workspace-brand-title">BPS Lombok Tengah</p>
            </div>
          </div>

          <div className="workspace-user">
            <div className="workspace-user-meta">
              <strong>{user.name}</strong>
              <span>
                {ROLE_LABELS[user.role]}, @{user.username}
              </span>
            </div>
            <button type="button" className="btn btn-secondary" onClick={onLogout}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="workspace-body">
        <aside className="workspace-sidebar" aria-label="Navigasi ruang kerja">
          <p className="workspace-nav-label">Menu</p>
          <nav className="workspace-nav">
            {nav.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === "/workspace"}
                className={({ isActive }) =>
                  isActive ? "workspace-nav-link active" : "workspace-nav-link"
                }
                onClick={(e) => {
                  if (!isDirty) return;
                  e.preventDefault();
                  requestLeave(() => navigate(item.to));
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {isDevelopmentAuthMode() ? (
            <p className="workspace-dev-note">
              Mode pengembangan: auth mock + data store sesi. Bukan produksi BPS.
            </p>
          ) : isLocalApiAuthMode() ? (
            <p className="workspace-dev-note">
              Mode API lokal: autentikasi & data melalui backend + database.
              Bukan SSO BPS produksi.
            </p>
          ) : null}
        </aside>

        <main className="workspace-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function WorkspaceLayout() {
  return (
    <UnsavedChangesProvider>
      <WorkspaceShell />
    </UnsavedChangesProvider>
  );
}
