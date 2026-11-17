<?php

namespace App\Auth;

final readonly class InternalAuthContext
{
    /**
     * @param list<string> $roles
     * @param list<string> $permissions
     */
    public function __construct(
        public string $service,
        public string $scope,
        public ?string $userId,
        public ?string $tenantId,
        public ?string $sid,
        public array $roles,
        public array $permissions,
    ) {
    }

    public function isAuthenticatedUser(): bool
    {
        return $this->userId !== null
            && $this->sid !== null;
    }

    public function hasPermission(string $permission): bool
    {
        return in_array(
            $permission,
            $this->permissions,
            true,
        );
    }

    /**
     * Check whether the context has at least one permission.
     *
     * @param list<string> $permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }

        return false;
    }

    public function hasRole(string $role): bool
    {
        return in_array(
            $role,
            $this->roles,
            true,
        );
    }

    public function isGlobalService(): bool
    {
        return $this->scope === 'GLOBAL'
            && $this->userId === null
            && $this->tenantId === null
            && $this->sid === null
            && $this->roles === []
            && $this->permissions === [];
    }
}
