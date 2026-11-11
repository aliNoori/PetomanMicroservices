export interface ReturnToLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

export interface AuthNavigationState {
  from?: ReturnToLocation;
  returnTo?: ReturnToLocation;
}