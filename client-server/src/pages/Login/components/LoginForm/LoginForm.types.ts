import type {
  LoginRequest,
} from "@/features/auth";



export interface LoginFormProps {


  /**
   * Controls submit button state
   * during authentication request.
   */
  loading: boolean;



  /**
   * Authentication error message.
   *
   * Null means there is no active error.
   */
  error: string | null;



  /**
   * Submit handler provided by parent container.
   *
   * LoginForm does not know about
   * authentication implementation.
   */
  onSubmit(
    payload: LoginRequest,
  ): Promise<void>;

}