import { Link, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../state/session";

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const session = getSession();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <strong className="brand">Event Booking</strong>
          <Link to="/events" className="nav-link">Events</Link>
          {session?.user.role === "ADMIN" && <Link to="/admin" className="nav-link">Admin</Link>}
        </div>
        <div className="topbar-right">
          {session ? (
            <>
              <span>{session.user.email}</span>
              <button
                onClick={() => {
                  clearSession();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </header>
      <main>
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
