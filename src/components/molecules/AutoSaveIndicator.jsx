import { useState, useEffect } from "react"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const AutoSaveIndicator = ({ isSaving = false, lastSaved = null }) => {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSaving, lastSaved])

  if (isSaving) {
    return (
      <div className={cn("autosave-indicator saving")}>
        <ApperIcon name="Loader2" size={12} className="animate-spin" />
        <span>Saving...</span>
      </div>
    )
  }

  if (showSaved) {
    return (
      <div className={cn("autosave-indicator saved")}>
        <ApperIcon name="Check" size={12} />
        <span>Saved</span>
      </div>
    )
  }

  return null
}

export default AutoSaveIndicator