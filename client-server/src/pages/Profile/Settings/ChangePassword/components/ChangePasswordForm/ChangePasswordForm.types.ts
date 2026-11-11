/**
 * Change password form submission payload.
 */
export interface ChangePasswordFormData {

  currentPassword: string;

  newPassword: string;

  confirmPassword: string;

}


/**
 * Change password form component contract.
 */
export interface ChangePasswordFormProps {

  /**
   * Called after client-side validation succeeds.
   */
  onSubmit(
    data: ChangePasswordFormData,
  ): Promise<void>;

}