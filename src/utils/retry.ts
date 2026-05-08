export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt >= maxAttempts) {
        throw error;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    }
  }

  throw new Error("withRetry: exhausted attempts without result.");
}
