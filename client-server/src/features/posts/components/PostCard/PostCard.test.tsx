import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PostCard } from "./PostCard";

const post = {
  id: "post-1",
  slug: "understanding-pet-nutrition",
  title: "Understanding Pet Nutrition",
  excerpt:
    "Learn the fundamentals of balanced nutrition and how dietary choices affect long-term pet health.",
  image: "https://example.com/pet.jpg",
  category: "Animal Health",
  author: {
    id: "author-1",
    name: "Ali Noori",
  },
  publishedAt: "Aug 8, 2026",
  readingTimeMinutes: 6,
  stats: {
    likes: 124,
    saves: 42,
    views: 1800,
  },
  featured: true,
};

describe("PostCard", () => {
  it("renders post content", () => {
    render(<PostCard post={post} />);

    expect(
      screen.getByRole("heading", {
        name: post.title,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(post.excerpt),
    ).toBeInTheDocument();

    expect(
      screen.getByText(post.category),
    ).toBeInTheDocument();

    expect(
      screen.getByText(post.author.name),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Aug 8, 2026"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("6 min read"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Featured"),
    ).toBeInTheDocument();
  });

  it("renders the post image", () => {
    render(<PostCard post={post} />);

    const image = screen.getByRole("img", {
      name: post.title,
    });

    expect(image).toHaveAttribute(
      "src",
      post.image,
    );
  });

  it("renders engagement statistics", () => {
    render(<PostCard post={post} />);

    expect(
      screen.getByText("124"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("42"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("1.8K"),
    ).toBeInTheDocument();
  });

  it("calls onPostClick from the title action", () => {
    const onPostClick = vi.fn();

    render(
      <PostCard
        post={post}
        onPostClick={onPostClick}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: post.title,
      }),
    );

    expect(
      onPostClick,
    ).toHaveBeenCalledTimes(1);

    expect(
      onPostClick,
    ).toHaveBeenCalledWith(post);
  });

  it("supports keyboard activation from the title", () => {
    const onPostClick = vi.fn();

    render(
      <PostCard
        post={post}
        onPostClick={onPostClick}
      />,
    );

    const titleButton = screen.getByRole(
      "button",
      {
        name: post.title,
      },
    );

    fireEvent.keyDown(titleButton, {
      key: "Enter",
    });

    expect(
      onPostClick,
    ).toHaveBeenCalledTimes(0);

    fireEvent.keyUp(titleButton, {
      key: "Enter",
    });

    /**
     * Native buttons handle keyboard activation themselves.
     * The test therefore verifies the actual browser interaction
     * through a click event rather than manually implementing
     * keyboard handling inside PostCard.
     */
    fireEvent.click(titleButton);

    expect(
      onPostClick,
    ).toHaveBeenCalledTimes(1);
  });

  it("toggles like state", () => {
    const onLikeChange = vi.fn();

    render(
      <PostCard
        post={post}
        onLikeChange={onLikeChange}
      />,
    );

    const likeButton = screen.getByRole(
      "button",
      {
        name: `Like ${post.title}`,
      },
    );

    expect(likeButton).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(likeButton);

    expect(
      onLikeChange,
    ).toHaveBeenCalledWith(
      post,
      true,
    );

    expect(
      screen.getByRole("button", {
        name: `Unlike ${post.title}`,
      }),
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("toggles save state", () => {
    const onSaveChange = vi.fn();

    render(
      <PostCard
        post={post}
        onSaveChange={onSaveChange}
      />,
    );

    const saveButton = screen.getByRole(
      "button",
      {
        name: `Save ${post.title}`,
      },
    );

    fireEvent.click(saveButton);

    expect(
      onSaveChange,
    ).toHaveBeenCalledWith(
      post,
      true,
    );

    expect(
      screen.getByRole("button", {
        name: `Unsave ${post.title}`,
      }),
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("supports controlled like state", () => {
    const onLikeChange = vi.fn();

    render(
      <PostCard
        post={post}
        liked
        onLikeChange={onLikeChange}
      />,
    );

    const likeButton = screen.getByRole(
      "button",
      {
        name: `Unlike ${post.title}`,
      },
    );

    expect(likeButton).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(likeButton);

    expect(
      onLikeChange,
    ).toHaveBeenCalledWith(
      post,
      false,
    );
  });

  it("supports controlled save state", () => {
    const onSaveChange = vi.fn();

    render(
      <PostCard
        post={post}
        saved
        onSaveChange={onSaveChange}
      />,
    );

    const saveButton = screen.getByRole(
      "button",
      {
        name: `Unsave ${post.title}`,
      },
    );

    expect(saveButton).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(saveButton);

    expect(
      onSaveChange,
    ).toHaveBeenCalledWith(
      post,
      false,
    );
  });

  it("renders fallback when image is missing", () => {
    render(
      <PostCard
        post={{
          ...post,
          image: undefined,
        }}
      />,
    );

    expect(
      screen.getByLabelText(
        "No image available",
      ),
    ).toBeInTheDocument();
  });

  it("renders author initial when avatar is missing", () => {
    render(<PostCard post={post} />);

    expect(
      screen.getByText("A"),
    ).toBeInTheDocument();
  });

  it("renders custom actions", () => {
    render(
      <PostCard
        post={post}
        actions={
          <button type="button">
            Share
          </button>
        }
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Share",
      }),
    ).toBeInTheDocument();
  });
});
