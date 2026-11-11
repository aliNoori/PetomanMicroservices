export type AlertVariant =
  | "info"
  | "success"
  | "warning"
  | "error";


export interface AlertProps {

  /**
   * Visual style variant.
   */
  variant?: AlertVariant;


  /**
   * Alert message content.
   */
  children: React.ReactNode;


  /**
   * Optional title.
   */
  title?: string;


  /**
   * Additional css classes.
   */
  className?: string;

}