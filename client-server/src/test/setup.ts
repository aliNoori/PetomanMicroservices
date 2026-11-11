import "@testing-library/jest-dom/vitest";

import {
  cleanup,
} from "@testing-library/react";

import {
  afterEach,
} from "vitest";

/**
 * Reset the rendered React tree after every test.
 *
 * Test isolation is essential for preventing DOM state from leaking
 * between independent component behavior tests.
 */
afterEach(() => {
  cleanup();
});