import Label from "@/components/atoms/Label"
import Input from "@/components/atoms/Input"
import Textarea from "@/components/atoms/Textarea"
import Select from "@/components/atoms/Select"

const FormField = ({ 
  label, 
  type = "text", 
  error, 
  required = false,
  children,
  ...props 
}) => {
  const renderInput = () => {
    if (type === "textarea") {
      return <Textarea error={!!error} {...props} />
    }
    
    if (type === "select") {
      return (
        <Select error={!!error} {...props}>
          {children}
        </Select>
      )
    }
    
    return <Input type={type} error={!!error} {...props} />
  }

  return (
    <div className="space-y-2">
      <Label required={required}>
        {label}
      </Label>
      {renderInput()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export default FormField