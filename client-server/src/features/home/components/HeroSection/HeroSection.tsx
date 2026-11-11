import {
  Button,
} from "../../../../components/common/Button";


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


function CpuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
    >
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}



export function HeroSection() {

  return (

    <section
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated px-6 py-12 shadow-lg sm:px-10 sm:py-16 lg:px-14"
    >

      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />


      <div className="relative flex flex-col gap-8">

        <div className="flex items-center gap-3">

          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">

            <CpuIcon />

          </span>


          <span className="text-sm font-semibold uppercase tracking-wider text-primary">

            MultiStack Engineering Platform

          </span>

        </div>



        <div className="max-w-4xl space-y-6">

          <h1
            id="home-hero-title"
            className="max-w-4xl text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl"
          >

            Building modern software with{" "}

            <span className="text-primary">
              production-grade
            </span>

            {" "}engineering foundations.

          </h1>



          <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">

            A modern engineering platform focused on scalable architecture,
            reusable components, semantic design systems, type-safe
            development, and production-ready application foundations.

          </p>


        </div>



        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          <Button rightIcon={<ArrowRightIcon />}>

            Explore Platform

          </Button>


          <Button variant="outline">

            View Architecture

          </Button>


        </div>



        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-text-muted">

          <span>React</span>

          <span>TypeScript</span>

          <span>Tailwind CSS</span>

          <span>Scalable Architecture</span>

        </div>


      </div>


    </section>

  );

}