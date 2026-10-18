const API = process.env.API_BASE_URL ?? "http://localhost:4000";
const USERS = Number(process.env.CONCURRENCY_USERS ?? 50);

async function login(email: string, password: string) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }

  const data = (await res.json()) as { data: { token: string } };
  return data.data.token;
}

async function main() {
  const token = await login("user@webe.local", "Password123!");

  const eventsRes = await fetch(`${API}/api/get/events`);
  const eventsData = (await eventsRes.json()) as {
    data: Array<{ id: string; seats: Array<{ seatNumber: number; isBooked: boolean }> }>;
  };

  const targetEvent = eventsData.data[0];
  if (!targetEvent) {
    throw new Error("No events found for test");
  }

  const candidateSeats = targetEvent.seats.filter((s) => !s.isBooked).slice(0, 10);
  if (candidateSeats.length < 10) {
    throw new Error("Need at least 10 available seats to run test");
  }

  const bookingCalls = Array.from({ length: USERS }, (_, idx) => {
    const seat = candidateSeats[idx % 10];
    return fetch(`${API}/api/post/bookings`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        "x-correlation-id": `load-${idx + 1}`
      },
      body: JSON.stringify({
        eventId: targetEvent.id,
        seatNumber: seat.seatNumber,
        idempotencyKey: `idem-${Date.now()}-${idx + 1}`
      })
    }).then(async (res) => ({ status: res.status, body: await res.json() }));
  });

  const results = await Promise.all(bookingCalls);
  const success = results.filter((r) => r.status === 201).length;
  const failed = results.length - success;

  console.log(JSON.stringify({ users: USERS, success, failed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
