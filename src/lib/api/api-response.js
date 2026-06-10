import { NextResponse } from "next/server";

export function ok(data, init) {
  return NextResponse.json({ data }, init);
}

export function created(data) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message, status = 400, details = null) {
  return NextResponse.json(
    {
      error: {
        message,
        details
      }
    },
    { status }
  );
}

