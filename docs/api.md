# API Endpoints

Base URL: `http://localhost:4000`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

## Public

- `GET /api/get/events`

## User (JWT required)

- `POST /api/post/bookings`
- `POST /api/post/payments/simulate`

## Admin (JWT + ADMIN role)

- `POST /api/admin/events`
- `PATCH /api/admin/events/:id`
- `DELETE /api/admin/events/:id`
- `GET /api/admin/bookings`

## Core Required Endpoints from Spec

- `GET /api/get/events`
- `POST /api/post/bookings`
