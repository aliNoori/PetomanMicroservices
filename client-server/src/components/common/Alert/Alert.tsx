import type {
  AlertProps,
} from "./Alert.types";


import {
  alertVariants,
} from "./Alert.variants";



export function Alert(
{
  variant = "info",
  title,
  children,
  className = "",
}: AlertProps,
) {


  return (

    <div
      role="alert"
      className={`
        rounded-lg
        border
        px-4
        py-3
        text-sm
        ${alertVariants[variant]}
        ${className}
      `}
    >

      {
        title && (

          <h3
            className="
              mb-1
              font-semibold
            "
          >
            {title}
          </h3>

        )
      }


      <div>
        {children}
      </div>


    </div>

  );

}