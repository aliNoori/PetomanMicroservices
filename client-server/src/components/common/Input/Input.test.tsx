import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  Input,
} from "./Input";


describe("Input", () => {

  it("renders an input", () => {

    render(
      <Input />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toBeInTheDocument();

  });


  it("renders label", () => {

    render(
      <Input
        label="Email"
        name="email"
      />,
    );

    expect(
      screen.getByLabelText("Email"),
    ).toBeInTheDocument();

  });


  it("uses name as input id when id is not provided", () => {

    render(
      <Input
        name="email"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveAttribute(
      "id",
      "email",
    );

  });


  it("uses explicit id when provided", () => {

    render(
      <Input
        id="user-email"
        name="email"
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toHaveAttribute(
      "id",
      "user-email",
    );

  });


  it("renders helper text", () => {

    render(
      <Input
        helperText="Enter your email address."
      />,
    );

    expect(
      screen.getByText(
        "Enter your email address.",
      ),
    ).toBeInTheDocument();

  });


  it("renders error message", () => {

    render(
      <Input
        error="Email is invalid."
      />,
    );

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(
      "Email is invalid.",
    );

  });


  it("does not render helper text when error exists", () => {

    render(
      <Input
        error="Email is invalid."
        helperText="Enter a valid email."
      />,
    );

    expect(
      screen.getByRole("alert"),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Enter a valid email.",
      ),
    ).not.toBeInTheDocument();

  });


  it("forwards input attributes", () => {

    render(
      <Input
        type="password"
        placeholder="Password"
        name="password"
        autoComplete="current-password"
      />,
    );

    const input =
      screen.getByPlaceholderText(
        "Password",
      );

    expect(input).toHaveAttribute(
      "type",
      "password",
    );

    expect(input).toHaveAttribute(
      "name",
      "password",
    );

    expect(input).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

  });


  it("supports disabled state", () => {

    render(
      <Input
        disabled
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toBeDisabled();

  });


  it("supports required state", () => {

    render(
      <Input
        required
      />,
    );

    expect(
      screen.getByRole("textbox"),
    ).toBeRequired();

  });


  it("forwards ref to the input element", () => {

    const ref = {
      current: null,
    } as React.RefObject<HTMLInputElement | null>;

    render(
      <Input
        ref={ref}
      />,
    );

    expect(ref.current).toBeInstanceOf(
      HTMLInputElement,
    );

  });

});