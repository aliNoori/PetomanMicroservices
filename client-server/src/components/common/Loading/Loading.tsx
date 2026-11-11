import type {
  LoadingProps,
} from "./Loading.types";


export function Loading(
  {
    text = "Loading...",
  }: LoadingProps,
) {

  return (

    <div
      role="status"
      aria-live="polite"
      className="
        flex
        items-center
        justify-center
        gap-3
        py-8
        text-sm
        text-text-secondary
      "
    >

      <span
        className="
          size-5
          animate-spin
          rounded-full
          border-2
          border-primary
          border-t-transparent
        "
      />


      <span>
        {text}
      </span>

    </div>

  );

}