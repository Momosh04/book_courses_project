import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import { setSession } from "../state/session";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("user@webe.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <h1>Login</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const session = await login({ email, password });
            setSession(session);
            navigate(session.user.role === "ADMIN" ? "/admin" : "/events");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
          }
        }}
        style={{ display: "grid", gap: 12, maxWidth: 420 }}
      >
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Sign in</button>
      </form>
      {error && <p style={{ color: "#c53030" }}>{error}</p>}
    </section>
  );
}
