import { useState } from "react";

import type { PostCardProps } from "./PostCard.types";

/**
 * Heart icon used by the like action.
 *
 * The icon supports both outlined and filled states so the visual
 * representation follows the current interaction state.
 */
function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className="size-4"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Bookmark icon used by the save action.
 *
 * The icon supports both outlined and filled states.
 */
function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className="size-4"
    >
      <path
        d="M6 4.5A2.5 2.5 0 0 1 8.5 2h7A2.5 2.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Eye icon used to represent the post view count.
 *
 * This is intentionally decorative because the parent element
 * provides the accessible label for the statistic.
 */
function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-4"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * Arrow icon used by the primary post navigation action.
 */
function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="size-4"
    >
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Formats large engagement numbers into compact human-readable values.
 *
 * Examples:
 * 1200      -> 1.2K
 * 1200000   -> 1.2M
 * 120       -> 120
 */
function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(value);
}

/**
 * Production-ready content card for editorial posts.
 *
 * The component supports:
 * - controlled and uncontrolled like state
 * - controlled and uncontrolled save state
 * - post navigation
 * - engagement statistics
 * - optional custom actions
 * - accessible native button interactions
 * - responsive media presentation
 *
 * Interactive areas intentionally use native buttons instead of
 * making the entire article a button. This prevents nested interactive
 * elements and keeps keyboard navigation semantically correct.
 */
export function PostCard({
  post,
  liked: controlledLiked,
  saved: controlledSaved,
  onLikeChange,
  onSaveChange,
  onPostClick,
  className = "",
  actions,
}: PostCardProps) {
  /**
   * Internal state is used only when the corresponding value
   * is not controlled by the parent component.
   */
  const [internalLiked, setInternalLiked] = useState(false);
  const [internalSaved, setInternalSaved] = useState(false);

  /**
   * Resolve the effective like state.
   *
   * A defined controlled value always has priority over internal state.
   */
  const isLiked =
    controlledLiked !== undefined
      ? controlledLiked
      : internalLiked;

  /**
   * Resolve the effective save state.
   */
  const isSaved =
    controlledSaved !== undefined
      ? controlledSaved
      : internalSaved;

  /**
   * Handles the like interaction.
   *
   * The internal state changes only when the component is uncontrolled.
   * Consumers are always notified through onLikeChange when provided.
   */
  const handleLike = () => {
    const nextValue = !isLiked;

    if (controlledLiked === undefined) {
      setInternalLiked(nextValue);
    }

    onLikeChange?.(post, nextValue);
  };

  /**
   * Handles the save interaction.
   *
   * The internal state changes only when the component is uncontrolled.
   */
  const handleSave = () => {
    const nextValue = !isSaved;

    if (controlledSaved === undefined) {
      setInternalSaved(nextValue);
    }

    onSaveChange?.(post, nextValue);
  };

  /**
   * Delegates post navigation to the parent.
   */
  const handlePostClick = () => {
    onPostClick?.(post);
  };

  return (
    <article
      className={[
        "group overflow-hidden rounded-xl border border-border",
        "bg-surface-elevated shadow-sm",
        "transition-[transform,box-shadow,border-color]",
        "duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Media and primary post information. */}
      <div>
        {onPostClick ? (
          <button
            type="button"
            onClick={handlePostClick}
            aria-label={`Open ${post.title}`}
            className={[
              "relative block aspect-video w-full overflow-hidden",
              "text-left",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/40",
              "focus-visible:ring-inset",
            ].join(" ")}
          >
            {post.image ? (
              <img
                src={post.image}
                alt={post.title}
                className={[
                  "h-full w-full object-cover",
                  "transition-transform duration-300 ease-out",
                  "group-hover:scale-105",
                ].join(" ")}
              />
            ) : (
              <div
                aria-label="No image available"
                role="img"
                className="flex h-full w-full items-center justify-center bg-surface text-sm text-text-muted"
              >
                No image
              </div>
            )}

            {/* Post classification badges. */}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-text-primary backdrop-blur">
                {post.category}
              </span>

              {post.featured && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-text-inverse">
                  Featured
                </span>
              )}
            </div>
          </button>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden">
            {post.image ? (
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                aria-label="No image available"
                role="img"
                className="flex h-full w-full items-center justify-center bg-surface text-sm text-text-muted"
              >
                No image
              </div>
            )}

            {/* Post classification badges. */}
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-text-primary backdrop-blur">
                {post.category}
              </span>

              {post.featured && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-text-inverse">
                  Featured
                </span>
              )}
            </div>
          </div>
        )}

        {/* Editorial content and metadata. */}
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            {/* The title is the semantic primary navigation action. */}
            {onPostClick ? (
              <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-text-primary">
                <button
                  type="button"
                  onClick={handlePostClick}
                  className={[
                    "text-left",
                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-primary/40",
                    "rounded-sm",
                  ].join(" ")}
                >
                  {post.title}
                </button>
              </h3>
            ) : (
              <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-text-primary">
                {post.title}
              </h3>
            )}

            <p className="line-clamp-3 text-sm leading-6 text-text-secondary">
              {post.excerpt}
            </p>
          </div>

          {/* Author information and publication metadata. */}
          <div className="flex items-center gap-3">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt=""
                aria-hidden="true"
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              >
                {post.author.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {post.author.name}
              </p>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <time dateTime={post.publishedAt}>
                  {post.publishedAt}
                </time>

                <span aria-hidden="true">·</span>

                <span>
                  {post.readingTimeMinutes} min read
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement and secondary actions. */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <div className="flex items-center gap-4 text-sm text-text-muted">
          {/* Like action. */}
          <button
            type="button"
            aria-label={
              isLiked
                ? `Unlike ${post.title}`
                : `Like ${post.title}`
            }
            aria-pressed={isLiked}
            onClick={handleLike}
            className={[
              "inline-flex items-center gap-1.5",
              "transition-colors hover:text-primary",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/40",
              "rounded-sm",
            ].join(" ")}
          >
            <HeartIcon filled={isLiked} />

            <span>
              {formatCount(
                post.stats.likes + (isLiked ? 1 : 0),
              )}
            </span>
          </button>

          {/* Save action. */}
          <button
            type="button"
            aria-label={
              isSaved
                ? `Unsave ${post.title}`
                : `Save ${post.title}`
            }
            aria-pressed={isSaved}
            onClick={handleSave}
            className={[
              "inline-flex items-center gap-1.5",
              "transition-colors hover:text-primary",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/40",
              "rounded-sm",
            ].join(" ")}
          >
            <BookmarkIcon filled={isSaved} />

            <span>
              {formatCount(
                post.stats.saves + (isSaved ? 1 : 0),
              )}
            </span>
          </button>

          {/* View count is informational and therefore not interactive. */}
          <span
            className="inline-flex items-center gap-1.5"
            aria-label={`${post.stats.views} views`}
          >
            <EyeIcon />

            <span>
              {formatCount(post.stats.views)}
            </span>
          </span>
        </div>

        {/* Optional consumer-provided actions and primary navigation. */}
        <div className="flex items-center gap-2">
          {actions}

          {onPostClick && (
            <button
              type="button"
              aria-label={`Read ${post.title}`}
              onClick={handlePostClick}
              className={[
                "inline-flex items-center gap-1.5",
                "text-sm font-medium text-primary",
                "transition-colors hover:text-primary-hover",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary/40",
                "rounded-sm",
              ].join(" ")}
            >
              Read
              <ArrowRightIcon />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
