/**
 * Check whether the user has a specific permission.
 */
export function hasPermission(
  userPermissions: readonly string[],
  requiredPermission: string,
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check whether the user has all required permissions.
 */
export function hasAllPermissions(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(userPermissions, permission),
  );
}

/**
 * Check whether the user has at least one required permission.
 */
export function hasAnyPermission(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  return requiredPermissions.some((permission) =>
    hasPermission(userPermissions, permission),
  );
}