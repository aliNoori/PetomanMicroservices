import {
  Button,
} from "../../../../components/common/Button";


import {
  PostCard,
} from "../../../posts/components/PostCard";



const posts = [
  {
    id: "post-1",
    slug: "understanding-pet-nutrition",
    title: "Understanding Pet Nutrition",
    excerpt:
      "Learn the fundamentals of balanced nutrition and how dietary choices affect long-term pet health.",
    image:
      "https://images.unsplash.com/photo-1552053831-71594a27632d",
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
  },


  {
    id: "post-2",
    slug: "pet-behavior-basics",
    title: "Pet Behavior Basics Every Owner Should",
    excerpt:
      "A practical introduction to understanding common behavior patterns and building better routines.",
    image:
      "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
    category: "Pet Behavior",
    author: {
      id: "author-2",
      name: "Petoman Editorial",
    },
    publishedAt: "Aug 6, 2026",
    readingTimeMinutes: 5,
    stats: {
      likes: 96,
      saves: 31,
      views: 1240,
    },
  },


  {
    id: "post-3",
    slug: "responsible-pet-care",
    title: "The Principles of Responsible Pet Care",
    excerpt:
      "The essential habits that create a healthier and more rewarding life for pets and their owners.",
    image:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e",
    category: "Pet Care",
    author: {
      id: "author-3",
      name: "Petoman Editorial",
    },
    publishedAt: "Aug 4, 2026",
    readingTimeMinutes: 7,
    stats: {
      likes: 81,
      saves: 27,
      views: 980,
    },
  },
];



export function PostSection() {

  return (

    <section
      aria-labelledby="latest-posts-title"
      className="space-y-6"
    >

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Knowledge Base
          </p>


          <h2
            id="latest-posts-title"
            className="mt-2 text-3xl font-bold tracking-tight text-text-primary"
          >
            Latest Posts
          </h2>


          <p className="mt-2 max-w-2xl text-text-secondary">

            A complete editorial card with author information,
            metadata, reading time, and engagement statistics.

          </p>

        </div>


        <Button variant="outline">

          Explore Knowledge

        </Button>


      </div>



      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {
          posts.map(
            (post) => (

              <PostCard

                key={post.id}

                post={post}


                onPostClick={
                  (item) => {

                    console.log(
                      "Open post:",
                      item.slug,
                    );

                  }
                }


                onLikeChange={
                  (item, nextValue) => {

                    console.log(
                      "Like:",
                      item.id,
                      nextValue,
                    );

                  }
                }


                onSaveChange={
                  (item, nextValue) => {

                    console.log(
                      "Save:",
                      item.id,
                      nextValue,
                    );

                  }
                }

              />

            ),
          )
        }

      </div>


    </section>

  );

}