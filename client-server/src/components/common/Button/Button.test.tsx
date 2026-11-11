import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom/vitest";

import { Button } from "./Button";

describe("Button", () => {
  describe("rendering", () => {
    it("renders its children", () => {
      render(
        <Button>
          Save changes
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Save changes",
        }),
      ).toBeInTheDocument();
    });

    it("renders with the default configuration", () => {
      render(
        <Button>
          Continue
        </Button>,
      );

      const button = screen.getByRole("button", {
        name: "Continue",
      });

      expect(button).toHaveAttribute(
        "type",
        "button",
      );

      expect(button).toBeEnabled();
    });
  });

  describe("variants and sizes", () => {
    it.each([
      "primary",
      "secondary",
      "outline",
      "ghost",
      "danger",
    ] as const)(
      "renders the %s variant",
      (variant) => {
        render(
          <Button variant={variant}>
            Action
          </Button>,
        );

        expect(
          screen.getByRole("button", {
            name: "Action",
          }),
        ).toBeInTheDocument();
      },
    );

    it.each([
      "sm",
      "md",
      "lg",
    ] as const)(
      "renders the %s size",
      (size) => {
        render(
          <Button size={size}>
            Action
          </Button>,
        );

        expect(
          screen.getByRole("button", {
            name: "Action",
          }),
        ).toBeInTheDocument();
      },
    );
  });

  describe("disabled state", () => {
    it("disables the button when disabled is true", () => {
      render(
        <Button disabled>
          Delete
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Delete",
        }),
      ).toBeDisabled();
    });

    it("does not trigger the click handler when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button
          disabled
          onClick={onClick}
        >
          Delete
        </Button>,
      );

      await user.click(
        screen.getByRole("button", {
          name: "Delete",
        }),
      );

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("disables the button while loading", () => {
      render(
        <Button loading>
          Save
        </Button>,
      );

      const button = screen.getByRole("button", {
        name: /save/i,
      });

      expect(button).toBeDisabled();

      expect(button).toHaveAttribute(
        "aria-busy",
        "true",
      );
    });

    it("does not trigger the click handler while loading", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button
          loading
          onClick={onClick}
        >
          Save
        </Button>,
      );

      await user.click(
        screen.getByRole("button", {
          name: /save/i,
        }),
      );

      expect(onClick).not.toHaveBeenCalled();
    });

    it("exposes a loading status to assistive technologies", () => {
      render(
        <Button loading>
          Save
        </Button>,
      );

      expect(
        screen.getByText("Loading"),
      ).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onClick when activated", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button onClick={onClick}>
          Save
        </Button>,
      );

      await user.click(
        screen.getByRole("button", {
          name: "Save",
        }),
      );

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("supports keyboard activation", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button onClick={onClick}>
          Save
        </Button>,
      );

      const button = screen.getByRole(
        "button",
        {
          name: "Save",
        },
      );

      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("button type", () => {
    it("supports submit buttons", () => {
      render(
        <Button type="submit">
          Submit
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Submit",
        }),
      ).toHaveAttribute(
        "type",
        "submit",
      );
    });

    it("supports reset buttons", () => {
      render(
        <Button type="reset">
          Reset
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Reset",
        }),
      ).toHaveAttribute(
        "type",
        "reset",
      );
    });
  });

  describe("icons", () => {
    it("renders a left icon", () => {
      render(
        <Button
          leftIcon={
            <span aria-hidden="true">
              +
            </span>
          }
        >
          Create
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Create",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByText("+"),
      ).toBeInTheDocument();
    });

    it("renders a right icon", () => {
      render(
        <Button
          rightIcon={
            <span aria-hidden="true">
              →
            </span>
          }
        >
          Continue
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Continue",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByText("→"),
      ).toBeInTheDocument();
    });
  });

  describe("full width", () => {
    it("applies the full-width class", () => {
      render(
        <Button fullWidth>
          Continue
        </Button>,
      );

      expect(
        screen.getByRole("button", {
          name: "Continue",
        }),
      ).toHaveClass("w-full");
    });
  });

  describe("custom attributes", () => {
    it("forwards native button attributes", () => {
      render(
        <Button
          data-testid="primary-action"
          name="primary-action"
          value="continue"
        >
          Continue
        </Button>,
      );

      const button = screen.getByTestId(
        "primary-action",
      );

      expect(button).toHaveAttribute(
        "name",
        "primary-action",
      );

      expect(button).toHaveAttribute(
        "value",
        "continue",
      );
    });
  });
});