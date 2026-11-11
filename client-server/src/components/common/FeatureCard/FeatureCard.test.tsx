import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureCard } from "./FeatureCard";

describe("FeatureCard", () => {
  it("renders the title and description", () => {
    render(
      <FeatureCard
        title="Frontend Engineering"
        description="React, Vite, and scalable UI architecture."
      />,
    );

    expect(
      screen.getByRole("heading", { name: /frontend engineering/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/react, vite, and scalable ui architecture/i),
    ).toBeInTheDocument();
  });

  it("renders an optional icon", () => {
    render(
      <FeatureCard
        title="Type Safety"
        description="TypeScript-first development."
        icon={<span data-testid="icon">TS</span>}
      />,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("forwards custom class names", () => {
    const { container } = render(
      <FeatureCard
        title="Design System"
        description="Semantic tokens and reusable components."
        className="custom-class"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});