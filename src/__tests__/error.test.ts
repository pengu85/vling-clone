import { describe, it, expect } from "vitest";
import { AppError, getErrorMessage } from "@/lib/error";

describe("AppError", () => {
  it("creates error with default values", () => {
    const err = new AppError("something went wrong");
    expect(err.message).toBe("something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.isRetryable).toBe(false);
    expect(err.name).toBe("AppError");
  });

  it("creates error with custom statusCode and isRetryable", () => {
    const err = new AppError("not found", 404, false);
    expect(err.statusCode).toBe(404);
    expect(err.isRetryable).toBe(false);
  });

  it("creates retryable error", () => {
    const err = new AppError("timeout", 503, true);
    expect(err.isRetryable).toBe(true);
    expect(err.statusCode).toBe(503);
  });

  it("is instance of Error", () => {
    const err = new AppError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe("getErrorMessage", () => {
  it("returns message from AppError", () => {
    const err = new AppError("app error message", 400);
    expect(getErrorMessage(err)).toBe("app error message");
  });

  it("returns message from regular Error", () => {
    const err = new Error("regular error");
    expect(getErrorMessage(err)).toBe("regular error");
  });

  it("returns string directly", () => {
    expect(getErrorMessage("string error")).toBe("string error");
  });

  it("returns default message for unknown types", () => {
    expect(getErrorMessage(42)).toBe("알 수 없는 오류가 발생했습니다.");
    expect(getErrorMessage(null)).toBe("알 수 없는 오류가 발생했습니다.");
    expect(getErrorMessage(undefined)).toBe("알 수 없는 오류가 발생했습니다.");
    expect(getErrorMessage({ foo: "bar" })).toBe("알 수 없는 오류가 발생했습니다.");
  });
});
