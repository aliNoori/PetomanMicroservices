import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  ChangePasswordForm,
} from "./ChangePasswordForm";


describe(
  "ChangePasswordForm",
  () => {

    it(
      "renders the password fields",
      () => {

        render(
          <ChangePasswordForm
            onSubmit={vi.fn()}
          />,
        );


        expect(
          screen.getByLabelText(
            "Current Password",
          ),
        ).toBeInTheDocument();


        expect(
          screen.getByLabelText(
            "New Password",
          ),
        ).toBeInTheDocument();


        expect(
          screen.getByLabelText(
            "Confirm New Password",
          ),
        ).toBeInTheDocument();


        expect(
          screen.getByRole(
            "button",
            {
              name: "Save Changes",
            },
          ),
        ).toBeInTheDocument();

      },
    );



    it(
      "shows a validation error when passwords do not match",
      async () => {

        const user =
          userEvent.setup();


        const onSubmit =
          vi.fn();


        render(
          <ChangePasswordForm
            onSubmit={onSubmit}
          />,
        );


        await user.type(
          screen.getByLabelText(
            "Current Password",
          ),
          "current-password",
        );


        await user.type(
          screen.getByLabelText(
            "New Password",
          ),
          "new-password",
        );


        await user.type(
          screen.getByLabelText(
            "Confirm New Password",
          ),
          "different-password",
        );


        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Save Changes",
            },
          ),
        );


        expect(
          screen.getByText(
            "New password and confirmation do not match.",
          ),
        ).toBeInTheDocument();


        expect(
          onSubmit,
        ).not.toHaveBeenCalled();

      },
    );



    it(
      "resets the form after successful submission",
      async () => {

        const user =
          userEvent.setup();


        const onSubmit =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );


        render(
          <ChangePasswordForm
            onSubmit={onSubmit}
          />,
        );


        const currentPassword =
          screen.getByLabelText(
            "Current Password",
          );


        const newPassword =
          screen.getByLabelText(
            "New Password",
          );


        const confirmPassword =
          screen.getByLabelText(
            "Confirm New Password",
          );


        await user.type(
          currentPassword,
          "current-password",
        );


        await user.type(
          newPassword,
          "new-password",
        );


        await user.type(
          confirmPassword,
          "new-password",
        );


        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Save Changes",
            },
          ),
        );


        expect(
          onSubmit,
        ).toHaveBeenCalledWith({
          currentPassword:
            "current-password",

          newPassword:
            "new-password",

          confirmPassword:
            "new-password",
        });


        expect(
          currentPassword,
        ).toHaveValue("");


        expect(
          newPassword,
        ).toHaveValue("");


        expect(
          confirmPassword,
        ).toHaveValue("");

      },
    );



    it(
      "preserves form values when submission fails",
      async () => {

        const user =
          userEvent.setup();


        const onSubmit =
          vi.fn()
            .mockRejectedValue(
              new Error(
                "Change password failed.",
              ),
            );


        render(
          <ChangePasswordForm
            onSubmit={onSubmit}
          />,
        );


        const currentPassword =
          screen.getByLabelText(
            "Current Password",
          );


        const newPassword =
          screen.getByLabelText(
            "New Password",
          );


        const confirmPassword =
          screen.getByLabelText(
            "Confirm New Password",
          );


        await user.type(
          currentPassword,
          "current-password",
        );


        await user.type(
          newPassword,
          "new-password",
        );


        await user.type(
          confirmPassword,
          "new-password",
        );


        await user.click(
          screen.getByRole(
            "button",
            {
              name: "Save Changes",
            },
          ),
        );


        expect(
          onSubmit,
        ).toHaveBeenCalledTimes(1);


        expect(
          currentPassword,
        ).toHaveValue(
          "current-password",
        );


        expect(
          newPassword,
        ).toHaveValue(
          "new-password",
        );


        expect(
          confirmPassword,
        ).toHaveValue(
          "new-password",
        );

      },
    );

  },
);