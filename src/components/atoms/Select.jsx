import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Select = forwardRef(({ 
  className, 
  error = false,
  children,
  ...props 
}, ref) => {
  return (
    <select
      className={cn(
        "form-field cursor-pointer",
        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})

Select.displayName = "Select"

export default Select