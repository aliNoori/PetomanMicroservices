function LayersIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
    >
      <path
        d="m12 3 9 5-9 5-9-5 9-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m3 12 9 5 9-5M3 16l9 5 9-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
    >
      <path
        d="M12 3 20 6v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m8.5 12 2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function SparklesIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
    >
      <path
        d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}


const platformFeatures = [
  {
    title: "Reusable Components",
    description:
      "Production-ready components designed for consistent behavior across applications.",
    icon: <LayersIcon />,
  },

  {
    title: "Type-Safe Foundation",
    description:
      "Strong TypeScript contracts keep component APIs predictable and maintainable.",
    icon: <ShieldIcon />,
  },

  {
    title: "Semantic Design System",
    description:
      "UI styling is driven by semantic tokens instead of hard-coded visual decisions.",
    icon: <SparklesIcon />,
  },

  {
    title: "Scalable Architecture",
    description:
      "A foundation designed to grow from a single application into a multi-stack platform.",
    icon: <LayersIcon />,
  },
];



export function FeatureGrid() {

  return (

    <section
      aria-labelledby="platform-features-title"
      className="space-y-8"
    >

      <div className="max-w-2xl space-y-3">

        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Engineering Foundation
        </p>


        <h2
          id="platform-features-title"
          className="text-3xl font-bold tracking-tight text-text-primary"
        >
          Built for real applications
        </h2>


        <p className="text-text-secondary">
          The foundation is designed around reusable primitives,
          explicit contracts, and production-ready interaction patterns.
        </p>


      </div>



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {platformFeatures.map(
          (feature) => (

            <article
              key={feature.title}
              className="rounded-xl border border-border bg-surface-elevated p-6 shadow-sm transition-shadow hover:shadow-md"
            >

              <div className="mb-5 inline-flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">

                {feature.icon}

              </div>


              <h3 className="text-base font-semibold text-text-primary">

                {feature.title}

              </h3>


              <p className="mt-2 text-sm leading-6 text-text-secondary">

                {feature.description}

              </p>


            </article>

          ),
        )}

      </div>


    </section>

  );

}