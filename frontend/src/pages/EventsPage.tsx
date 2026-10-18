import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBooking, listEvents, listMyBookings, simulatePayment } from "../api/client";

export function EventsPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seatInput, setSeatInput] = useState<string>("");
  const [activePaymentBookingId, setActivePaymentBookingId] = useState<string | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const queryClient = useQueryClient();

  const eventsQuery = useQuery({
    queryKey: ["events", eventsPage],
    queryFn: () => listEvents({ page: eventsPage, pageSize: 6 })
  });

  const myBookingsQuery = useQuery({
    queryKey: ["my-bookings", bookingsPage],
    queryFn: () => listMyBookings({ page: bookingsPage, pageSize: 6 })
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setSuccess("Booking created successfully.");
      setError(null);
      setSeatInput("");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Booking failed");
    }
  });

  const paymentMutation = useMutation({
    mutationFn: simulatePayment,
    onSuccess: () => {
      setActivePaymentBookingId(null);
      setSuccess("Payment simulation completed.");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err) => {
      setActivePaymentBookingId(null);
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Payment simulation failed");
    }
  });

  const events = eventsQuery.data?.items ?? [];
  const eventsMeta = eventsQuery.data?.meta;
  const myBookings = myBookingsQuery.data?.items ?? [];
  const myBookingsMeta = myBookingsQuery.data?.meta;

  const resolvedEventId = selectedEvent || events[0]?.id || "";

  const current = useMemo(() => events.find((e) => e.id === resolvedEventId), [events, resolvedEventId]);

  return (
    <section>
      <h1>Events</h1>
      <button onClick={() => void eventsQuery.refetch()}>Refresh</button>
      {eventsQuery.isLoading && <p>Loading events...</p>}
      {myBookingsQuery.isLoading && <p>Loading your bookings...</p>}
      {error && <p style={{ color: "#c53030" }}>{error}</p>}
      {success && <p style={{ color: "#2f855a" }}>{success}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {events.map((event) => (
            <article
              key={event.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: 14,
                marginBottom: 12,
                border: resolvedEventId === event.id ? "2px solid #2b6cb0" : "2px solid transparent"
              }}
            >
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p>Available Seats: {event.availableSeats}/{event.capacity}</p>
              {resolvedEventId === event.id ? (
                <p style={{ color: "#2b6cb0", fontWeight: 600 }}>Selected for booking</p>
              ) : (
                <button
                  onClick={() => {
                    setSelectedEvent(event.id);
                    setSuccess(`Selected event: ${event.title}`);
                    setError(null);
                  }}
                >
                  Select for Booking
                </button>
              )}
            </article>
          ))}
          <div className="pager">
            <button
              onClick={() => setEventsPage((current) => Math.max(1, current - 1))}
              disabled={eventsPage <= 1}
            >
              Previous
            </button>
            <span className="pager-info">
              Page {eventsMeta?.page ?? eventsPage} of {eventsMeta?.totalPages ?? 1}
            </span>
            <button
              onClick={() => setEventsPage((current) => current + 1)}
              disabled={eventsMeta ? eventsPage >= eventsMeta.totalPages : true}
            >
              Next
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 8, padding: 14 }}>
          <h2>Seat Booking</h2>
          {!current && <p>Select an event.</p>}
          {current && (
            <>
              <div style={{ background: "#ebf8ff", border: "1px solid #90cdf4", borderRadius: 6, padding: 10, marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Currently selected event</p>
                <p style={{ margin: "6px 0 0" }}>{current.title}</p>
                <p style={{ margin: "4px 0 0", color: "#4a5568" }}>
                  Available seats: {current.availableSeats}/{current.capacity}
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  setSuccess(null);

                  const seatNumber = Number(seatInput);
                  if (!Number.isInteger(seatNumber) || seatNumber <= 0) {
                    setError("Please enter a valid seat number.");
                    return;
                  }

                  bookingMutation.mutate({
                    eventId: current.id,
                    seatNumber,
                    idempotencyKey: crypto.randomUUID()
                  });
                }}
                style={{ display: "grid", gap: 10 }}
              >
                <label htmlFor="seat">Seat Number</label>
                <input
                  id="seat"
                  type="number"
                  min={1}
                  value={seatInput}
                  onChange={(e) => setSeatInput(e.target.value)}
                />
                <button type="submit" disabled={bookingMutation.isPending}>Book Seat</button>
              </form>
            </>
          )}

          {myBookings.length > 0 && (
            <div style={{ marginTop: 14, borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <h3 style={{ marginTop: 0 }}>Your Bookings</h3>
              <p style={{ marginTop: 0, color: "#4a5568" }}>
                This list is fetched from server, survives refresh, and pending bookings expire automatically after timeout.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {myBookings.map((booking) => (
                  <div key={booking.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                    <p style={{ margin: "0 0 6px" }}><strong>Booking ID:</strong> {booking.id}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Event:</strong> {booking.event.title}</p>
                    <p style={{ margin: "0 0 6px" }}><strong>Seat:</strong> {booking.seat.seatNumber}</p>
                    <p style={{ margin: "0 0 8px" }}><strong>Status:</strong> {booking.status}</p>
                    {booking.status === "PENDING_PAYMENT" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setActivePaymentBookingId(booking.id);
                            paymentMutation.mutate({ bookingId: booking.id, shouldSucceed: true });
                          }}
                          disabled={paymentMutation.isPending && activePaymentBookingId === booking.id}
                        >
                          Simulate Success
                        </button>
                        <button
                          onClick={() => {
                            setActivePaymentBookingId(booking.id);
                            paymentMutation.mutate({ bookingId: booking.id, shouldSucceed: false });
                          }}
                          disabled={paymentMutation.isPending && activePaymentBookingId === booking.id}
                        >
                          Simulate Fail
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "#4a5568" }}>No further payment action required.</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="pager">
                <button
                  onClick={() => setBookingsPage((current) => Math.max(1, current - 1))}
                  disabled={bookingsPage <= 1}
                >
                  Previous
                </button>
                <span className="pager-info">
                  Page {myBookingsMeta?.page ?? bookingsPage} of {myBookingsMeta?.totalPages ?? 1}
                </span>
                <button
                  onClick={() => setBookingsPage((current) => current + 1)}
                  disabled={myBookingsMeta ? bookingsPage >= myBookingsMeta.totalPages : true}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
