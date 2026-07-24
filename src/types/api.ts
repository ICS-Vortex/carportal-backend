export type ApiSuccessResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorDetails = unknown;

export type ApiErrorObject = {
  code: string;
  message: string;
  details?: ApiErrorDetails;
};

export type ApiErrorResponse = {
  error: ApiErrorObject;
};

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: ApiErrorDetails;
  issues?: ApiErrorDetails;
};