import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(
      <Card>
        Card content
      </Card>,
    );

    expect(
      screen.getByText("Card content"),
    ).toBeInTheDocument();
  });

  it("renders header content", () => {
    render(
      <Card
        header={
          <span>Card Header</span>
        }
      >
      Content
      </Card>,
    );

    expect(
      screen.getByText("Card Header"),
    ).toBeInTheDocument();
  });

  it("renders footer content", () => {
    render(
      <Card
        footer={
          <span>Card Footer</span>
        }
      >
      Content
      </Card>,
    );

    expect(
      screen.getByText("Card Footer"),
    ).toBeInTheDocument();
  });

  it("supports custom className", () => {
    render(
      <Card className="custom-card">
        Content
      </Card>,
    );

    expect(
      screen.getByText("Content"),
    ).toHaveClass("custom-card");
  });

  it("supports hoverable state", () => {
    render(
      <Card hoverable>
        Content
      </Card>,
    );

    expect(
      screen.getByText("Content"),
    ).toBeInTheDocument();
  });

  it("supports disabled state", () => {
  render(
    <Card
      disabled
      data-testid="card"
    >
      Content
    </Card>,
  );

  const card =
    screen.getByTestId("card");

  expect(card).toHaveAttribute(
    "aria-disabled",
    "true",
  );
});

  it("calls onClick when clickable", () => {
    const onClick = vi.fn();

    render(
      <Card
        clickable
        onClick={onClick}
      >
        Content
      </Card>,
    );

    const card = screen.getByRole(
      "button",
    );

    fireEvent.click(card);

    expect(onClick)
      .toHaveBeenCalledTimes(1);
  });

  it("does not expose button semantics when not clickable", () => {
    render(
      <Card>
        Content
      </Card>,
    );

    expect(
      screen.queryByRole("button"),
    ).not.toBeInTheDocument();
  });
});