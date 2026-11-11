import {
  forwardRef,
  useId,
} from "react";


import type {
  InputProps,
} from "./Input.types";



export const Input =
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        label,
        error,
        helperText,
        id,
        className = "",
        ...props
      },
      ref,
    ) => {


      const generatedId =
        useId();


      const inputId =
        id ??
        props.name ??
        generatedId;



      return (

        <div className="flex w-full flex-col gap-2">


          {
            label && (

              <label

                htmlFor={inputId}

                className="
                  text-sm
                  font-medium
                  text-text-primary
                "

              >

                {label}

              </label>

            )
          }




          <input

            ref={ref}

            id={inputId}

            className={`
              h-11
              rounded-lg
              border
              bg-surface
              px-3
              text-sm
              text-text-primary
              outline-none
              transition

              placeholder:text-text-muted

              focus:ring-2
              focus:ring-primary/30

              ${
                error
                  ? `
                    border-error
                    focus:border-error
                  `
                  :
                  `
                    border-border
                    focus:border-primary
                  `
              }

              ${className}
            `}

            {...props}

          />



          {
            error && (

              <p
                role="alert"
                className="
                  text-sm
                  text-error
                "
              >

                {error}

              </p>

            )
          }




          {
            helperText && !error && (

              <p
                className="
                  text-sm
                  text-text-muted
                "
              >

                {helperText}

              </p>

            )
          }

        </div>

      );

    },
  );



Input.displayName =
  "Input";