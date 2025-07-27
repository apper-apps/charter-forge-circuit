import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Label = forwardRef(({ 
  className, 
  required = false,
  children,
  ...props 
}, ref) => {
  return (
    <label
      className={cn("form-label", className)}
      ref={ref}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
})

Label.displayName = "Label"

export default Label