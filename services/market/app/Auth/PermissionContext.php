<?php

namespace App\Auth;

final readonly class PermissionContext
{
    /**
     * @param array<string> $permissions
     */
    public function __construct(
        public array $permissions,
    ) {
    }

    public function has(string $permission): bool
    {
        return in_array(
            $permission,
            $this->permissions,
            true,
        );
    }

    /**
     * @param array<string> $permissions
     */
    public function hasAny(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->has($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string> $permissions
     */
    public function hasAll(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->has($permission)) {
                return false;
            }
        }

        return true;
    }
}