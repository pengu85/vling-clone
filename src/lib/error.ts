// NOTE: This file is used exclusively by tests (src/__tests__/error.test.ts).
// It is not imported by any production app code.

export class AppError extends Error {
  statusCode: number;
  isRetryable: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "알 수 없는 오류가 발생했습니다.";
}
