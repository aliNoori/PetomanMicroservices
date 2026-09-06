<?php

namespace App\Cache;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Cache;

class ProductCache
{
    private const VERSION_PREFIX = 'products:version:';
    private const LIST_KEY_PREFIX = 'products:list:';

    private const VERSION_TTL = 2_592_000; // 30 days
    private const LIST_TTL = 300; // 5 minutes

    private function store(): CacheRepository
    {
        return Cache::store('redis');
    }

    // ============================================================
    // Tenant Tag
    // ============================================================

    public function tenantTag(string $tenantId): string
    {
        return "tenant:{$tenantId}:products";
    }

    public function tenantTags(string $tenantId): array
    {
        return [
            $this->tenantTag($tenantId),
        ];
    }

    // ============================================================
    // Version
    // ============================================================

    public function version(string $tenantId): int
    {
        return (int) $this->store()->remember(
            self::VERSION_PREFIX . $tenantId,
            self::VERSION_TTL,
            fn () => 1,
        );
    }

    public function bumpVersion(string $tenantId): int
    {
        $key = self::VERSION_PREFIX . $tenantId;

        $newVersion = $this->version($tenantId) + 1;

        $this->store()->put(
            $key,
            $newVersion,
            self::VERSION_TTL,
        );

        return $newVersion;
    }

    // ============================================================
    // List Key
    // ============================================================

    public function listKey(
        string $tenantId,
        int $perPage,
        ?string $cursor,
    ): string {
        $version = $this->version($tenantId);

        $cursorHash = $cursor !== null
            ? hash('sha256', $cursor)
            : 'first';

        return implode(':', [
            self::LIST_KEY_PREFIX,
            $tenantId,
            "v{$version}",
            "per{$perPage}",
            $cursorHash,
        ]);
    }

    // ============================================================
    // List Cache
    // ============================================================

    /**
     * @return array{
     *     items: array<int, array<string, mixed>>,
     *     next_cursor: ?string,
     *     previous_cursor: ?string
     * }
     */
    public function getList(
        string $tenantId,
        int $perPage,
        ?string $cursor,
    ): ?array {
        $key = $this->listKey(
            $tenantId,
            $perPage,
            $cursor,
        );

        return $this->store()
            ->tags($this->tenantTags($tenantId))
            ->get($key);
    }

    /**
     * @param array{
     *     items: array<int, array<string, mixed>>,
     *     next_cursor: ?string,
     *     previous_cursor: ?string
     * } $payload
     */
    public function putList(
        string $tenantId,
        int $perPage,
        ?string $cursor,
        array $payload,
    ): void {
        $key = $this->listKey(
            $tenantId,
            $perPage,
            $cursor,
        );

        $this->store()
            ->tags($this->tenantTags($tenantId))
            ->put(
                $key,
                $payload,
                self::LIST_TTL,
            );
    }

    // ============================================================
    // Invalidation
    // ============================================================

    public function forgetTenant(string $tenantId): void
    {
        /*
         * Version bump makes every old list key obsolete.
         */
        $this->bumpVersion($tenantId);

        /*
         * Tags remove the old entries immediately
         * when the cache driver supports tags.
         */
        $this->store()
            ->tags($this->tenantTags($tenantId))
            ->flush();
    }
}