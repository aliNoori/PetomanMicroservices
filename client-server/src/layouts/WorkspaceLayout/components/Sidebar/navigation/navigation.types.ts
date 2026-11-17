
export interface WorkspaceNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  requiredPermissions?: string[];
  children?: WorkspaceNavigationItem[];
}

export interface WorkspaceNavigationGroup {
  id: string;
  label: string;
  items: WorkspaceNavigationItem[];
}
