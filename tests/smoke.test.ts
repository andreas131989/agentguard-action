import { describe, expect, it, vi } from "vitest";

import { log } from "../src/utils/logger.js";

describe("Milestone 0 smoke test", () => {
  it("logs an info message", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    log("info", "test message");

    expect(spy).toHaveBeenCalledWith("[agentguard:info] test message");

    spy.mockRestore();
  });
});
