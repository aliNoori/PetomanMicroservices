<?php

namespace App\Auth;

final readonly class AuthContext
{
    public function __construct(
        public string $userId,
        public ?string $tenantId,
        public string $email,
        public array $roles,
        public array $permissions,
    ) {
    }
}