import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createEvent, deleteEvent, listAdminBookings, listEvents, updateEvent } from "../api/client";

export function AdminPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [eventsPage, setEventsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);

  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings", bookingsPage],
    queryFn: () => listAdminBookings({ page: bookingsPage, pageSize: 8 })
  });

  const eventsQuery = useQuery({
    queryKey: ["events", eventsPage],
    queryFn: () => listEvents({ page: eventsPage, pageSize: 8 })
  });

  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      setError(null);
      setSuccess("Event created successfully.");
      setTitle("");
      setDescription("");
      setCapacity("");
      setStartsAt("");
      setEndsAt("");
      await bookingsQuery.refetch();
      await eventsQuery.refetch();
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Create event failed");
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: (input: { eventId: string; payload: Parameters<typeof updateEvent>[1] }) =>
      updateEvent(input.eventId, input.payload),
    onSuccess: async () => {
      setError(null);
      setSuccess("Event updated successfully.");
      setEditingEventId(null);
      await eventsQuery.refetch();
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Update event failed");
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: async () => {
      setError(null);
      setSuccess("Event deleted successfully.");
      await eventsQuery.refetch();
    },
    onError: (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : "Delete event failed");
    }
  });

  const events = eventsQuery.data?.items ?? [];
  const eventsMeta = eventsQuery.data?.meta;
  const bookings = bookingsQuery.data?.items ?? [];
  const bookingsMeta = bookingsQuery.data?.meta;
  const editingEvent = events.find((event) => event.id === editingEventId) ?? null;
  const bookedSeatsForEdit = editingEvent ? editingEvent.seats.filter((seat) => seat.isBooked).length : 0;

  function statusClass(status: string) {
    const lower = status === "PENDING_PAYMENT" ? "pending" : status.toLowerCase();
    return `badge ${lower}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  function toDateInputValue(value: string) {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return (
    <section>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">Manage events, monitor bookings, and track payment outcomes.</p>
      {bookingsQuery.isLoading && <p>Loading bookings...</p>}
      {eventsQuery.isLoading && <p>Loading events...</p>}
      {error && <p className="notice error">{error}</p>}
      {success && <p className="notice success">{success}</p>}
      {editingEvent && (
        <p className="notice success">
          Edit mode is active for: <strong>{editingEvent.title}</strong>
        </p>
      )}

      <div className="grid-two">
        <div className="card">
          <h2>Create Event</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setSuccess(null);

              const capacityNumber = Number(capacity);
              if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
                setError("Capacity must be a positive number.");
                return;
              }

              if (!startsAt || !endsAt) {
                setError("Start and end date are required.");
                return;
              }

              const start = new Date(startsAt);
              const end = new Date(endsAt);

              if (end <= start) {
                setError("End date must be after start date.");
                return;
              }

              createEventMutation.mutate({
                title,
                description,
                startsAt: start.toISOString(),
                endsAt: end.toISOString(),
                capacity: capacityNumber
              });
            }}
            className="stack"
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <input
              type="number"
              value={capacity}
              min={1}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Capacity"
            />
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
            <button type="submit" disabled={createEventMutation.isPending}>Create</button>
          </form>
        </div>

        <div className="card">
          <h2>Events</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Capacity</th>
                  <th>Booked</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const bookedSeats = event.seats.filter((seat) => seat.isBooked).length;
                  return (
                  <tr key={event.id} className={editingEventId === event.id ? "row-editing" : undefined}>
                    <td>{event.title}</td>
                    <td>{formatDate(event.startsAt)}</td>
                    <td>{event.capacity}</td>
                    <td>{bookedSeats}</td>
                    <td>{event.availableSeats}</td>
                    <td>
                      <div className="inline">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEventId(event.id);
                            setEditTitle(event.title);
                            setEditDescription(event.description ?? "");
                            setEditCapacity(String(event.capacity));
                            setEditStartsAt(toDateInputValue(event.startsAt));
                            setEditEndsAt(toDateInputValue(event.endsAt));
                            setError(null);
                            setSuccess(null);
                          }}
                        >
                          {editingEventId === event.id ? "Editing..." : "Edit"}
                        </button>
                        <button
                          type="button"
                          className="action-danger"
                          onClick={() => {
                            deleteEventMutation.mutate(event.id);
                          }}
                          disabled={deleteEventMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">No events available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
      </div>

      {editingEventId && (
        <div className="card" style={{ marginTop: 18 }}>
          <h2>Edit Event: {editingEvent?.title ?? "Selected Event"}</h2>
          <p className="muted">
            Booked seats: {bookedSeatsForEdit}. Capacity cannot be reduced below this number.
          </p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setSuccess(null);

              const capacityNumber = Number(editCapacity);
              if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
                setError("Capacity must be a positive number.");
                return;
              }

              if (capacityNumber < bookedSeatsForEdit) {
                setError(`Capacity cannot be lower than the ${bookedSeatsForEdit} booked seats.`);
                return;
              }

              const start = new Date(editStartsAt);
              const end = new Date(editEndsAt);
              if (!editStartsAt || !editEndsAt || end <= start) {
                setError("Provide a valid start/end date where end is after start.");
                return;
              }

              updateEventMutation.mutate({
                eventId: editingEventId,
                payload: {
                  title: editTitle,
                  description: editDescription,
                  startsAt: start.toISOString(),
                  endsAt: end.toISOString(),
                  capacity: capacityNumber
                }
              });
            }}
          >
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
            <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
            <input type="number" value={editCapacity} min={Math.max(1, bookedSeatsForEdit)} onChange={(e) => setEditCapacity(e.target.value)} />
            <input type="datetime-local" value={editStartsAt} onChange={(e) => setEditStartsAt(e.target.value)} />
            <input type="datetime-local" value={editEndsAt} onChange={(e) => setEditEndsAt(e.target.value)} />
            <div className="inline">
              <button type="submit" disabled={updateEventMutation.isPending}>Save Changes</button>
              <button
                type="button"
                onClick={() => setEditingEventId(null)}
                className="action-danger"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Bookings Monitor</h2>
        <p className="muted">Track every booking, seat, and payment status in one place.</p>
        <div className="inline" style={{ marginBottom: 10 }}>
          <button onClick={() => void bookingsQuery.refetch()}>Refresh Bookings</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Event</th>
                <th>Seat</th>
                <th>Booking Status</th>
                <th>Payment</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const paymentStatus = booking.payments?.[0]?.status ?? "PENDING";
                return (
                  <tr key={booking.id}>
                    <td>{booking.id.slice(0, 8)}...</td>
                    <td>{booking.user.email}</td>
                    <td>{booking.event.title}</td>
                    <td>{booking.seat.seatNumber}</td>
                    <td><span className={statusClass(booking.status)}>{booking.status}</span></td>
                    <td><span className={statusClass(paymentStatus)}>{paymentStatus}</span></td>
                    <td>{formatDate(booking.createdAt)}</td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">No bookings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <button
            onClick={() => setBookingsPage((current) => Math.max(1, current - 1))}
            disabled={bookingsPage <= 1}
          >
            Previous
          </button>
          <span className="pager-info">
            Page {bookingsMeta?.page ?? bookingsPage} of {bookingsMeta?.totalPages ?? 1}
          </span>
          <button
            onClick={() => setBookingsPage((current) => current + 1)}
            disabled={bookingsMeta ? bookingsPage >= bookingsMeta.totalPages : true}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
