import { forwardRef } from "react"
import { cn } from "@/utils/cn"

const Textarea = forwardRef(({ 
  className, 
  error = false,
  rows = 4,
  ...props 
}, ref) => {
return (
    <textarea
      rows={rows}
      dir="ltr"
      className={cn(
        "form-field resize-none",
        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export default Textarea