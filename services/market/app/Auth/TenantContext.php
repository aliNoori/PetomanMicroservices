<?php

namespace App\Auth;

final readonly class TenantContext
{
    public function __construct(
        public string $tenantId,
    ) {
    }
}