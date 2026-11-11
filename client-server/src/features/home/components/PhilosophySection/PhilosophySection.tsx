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



export function PhilosophySection() {

  return (

    <section
      aria-labelledby="component-philosophy-title"
      className="rounded-2xl border border-border bg-surface-elevated p-8 shadow-md sm:p-10"
    >

      <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">


        <div className="max-w-3xl space-y-4">


          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Component Architecture
          </p>



          <h2
            id="component-philosophy-title"
            className="text-3xl font-bold tracking-tight text-text-primary"
          >

            One foundation, multiple real-world use cases.

          </h2>



          <p className="leading-7 text-text-secondary">

            Components are not being built as isolated visual examples.
            Each component is designed around a real product requirement,
            explicit TypeScript interfaces, accessible interactions,
            and reusable behavior.

          </p>



          <div className="flex flex-wrap gap-3 pt-2 text-sm text-text-muted">

            <span>
              Accessible
            </span>


            <span>
              •
            </span>


            <span>
              Type Safe
            </span>


            <span>
              •
            </span>


            <span>
              Composable
            </span>


            <span>
              •
            </span>


            <span>
              Production Ready
            </span>


          </div>


        </div>



        <Button
          rightIcon={<ArrowRightIcon />}
        >

          Explore Components

        </Button>


      </div>


    </section>

  );

}