// lib/errors.ts — Consistent API error responses

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.statusCode });
  }
  console.error("[Unhandled API Error]", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export const Errors = {
  UNAUTHORIZED: new ApiError(401, "You must be signed in"),
  FORBIDDEN: new ApiError(403, "You do not have permission to do this"),
  NOT_FOUND: (resource: string) => new ApiError(404, `${resource} not found`),
  CONFLICT: (msg: string) => new ApiError(409, msg),
  VALIDATION: (msg: string) => new ApiError(422, msg),
} as const;
