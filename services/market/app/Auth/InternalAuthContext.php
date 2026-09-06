<?php

namespace App\Auth;

final readonly class InternalAuthContext
{
    public function __construct(
        public string $service,
        public ?string $tenantId,
    ) {
    }
}