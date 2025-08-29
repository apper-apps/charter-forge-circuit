import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const RichTextEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start writing...",
  className = "",
  autoSave = false,
  onAutoSave
}) => {
const [content, setContent] = useState(value || "")
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)

useEffect(() => {
    const currentValue = value || ""
    if (editorRef.current && !isFocused && editorRef.current.innerHTML !== currentValue) {
      editorRef.current.innerHTML = currentValue
      setContent(currentValue)
    }
  }, [value, isFocused])

useEffect(() => {
    const currentValue = value || ""
    if (autoSave && onAutoSave && content && content !== currentValue) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave(content)
      }, 1000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content, autoSave, onAutoSave, value])

const handleInput = () => {
    const newContent = editorRef.current.innerHTML || ""
    setContent(newContent)
    onChange?.(newContent)
  }

const handleFocus = () => {
    setIsFocused(true)
  }

const handleBlur = () => {
    setIsFocused(false)
    // Sync content after blur to ensure latest value is applied
    const currentValue = value || ""
    if (editorRef.current && currentValue !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = currentValue
      setContent(currentValue)
    }
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current.focus()
    handleInput()
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className={cn(
        "flex items-center gap-2 p-2 border rounded-lg bg-gray-50 transition-colors",
        isFocused && "border-primary-500 bg-primary-50"
      )}>
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-2 rounded hover:bg-white hover:shadow-sm transition-all"
          title="Bold"
        >
          <ApperIcon name="Bold" size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-2 rounded hover:bg-white hover:shadow-sm transition-all"
          title="Italic"
        >
          <ApperIcon name="Italic" size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 rounded hover:bg-white hover:shadow-sm transition-all"
          title="Bullet List"
        >
          <ApperIcon name="List" size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 rounded hover:bg-white hover:shadow-sm transition-all"
          title="Numbered List"
        >
          <ApperIcon name="ListOrdered" size={16} />
        </button>
      </div>

{/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="rich-editor"
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  )
}

export default RichTextEditor