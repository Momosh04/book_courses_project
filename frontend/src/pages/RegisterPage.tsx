import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/client";
import { setSession } from "../state/session";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <h1>Register</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const session = await register({ email, password, role: "USER" });
            setSession(session);
            navigate("/events");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
          }
        }}
        style={{ display: "grid", gap: 12, maxWidth: 420 }}
      >
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Create account</button>
      </form>
      {error && <p style={{ color: "#c53030" }}>{error}</p>}
    </section>
  );
}
