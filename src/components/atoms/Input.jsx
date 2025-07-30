import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Input = forwardRef(({ 
  className, 
  type = "text",
  error = false,
  value,
  ...props 
}, ref) => {
  return (
    <input
      type={type}
      dir="ltr"
      className={cn(
        "form-field",
        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        className
      )}
      ref={ref}
      value={value ?? ""}
      {...props}
    />
  )
})

Input.displayName = "Input"

export default Input