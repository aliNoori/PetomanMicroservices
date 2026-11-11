import type { RegisterUserRequest } from "@/features/auth";

export interface RegisterFormProps {
  loading: boolean;
  error: string | null;
  onSubmit: (payload: RegisterUserRequest) => Promise<void>;
}