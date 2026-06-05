import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PREDICTION_LOCKED"
  | "INTERNAL_ERROR";

const statusByCode: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PREDICTION_LOCKED: 423,
  INTERNAL_ERROR: 500,
};

export function apiError(error: string, code: ApiErrorCode) {
  return NextResponse.json({ error, code }, { status: statusByCode[code] });
}
