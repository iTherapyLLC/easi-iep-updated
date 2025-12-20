import * as React from "react"

import { cn } from "@/lib/utils"
import { stripRTL } from "@/utils/strip-rtl"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, onChange, value, defaultValue, ...props }, ref) => {
    // Strip RTL characters from controlled value
    const cleanValue = typeof value === 'string' ? stripRTL(value) : value;
    const cleanDefaultValue = typeof defaultValue === 'string' ? stripRTL(defaultValue) : defaultValue;
    
    // Wrap onChange to strip RTL characters from input
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        // Create a new event-like object with sanitized value
        const sanitizedValue = stripRTL(e.target.value);
        // Create synthetic event with cleaned value
        Object.defineProperty(e, 'target', {
          writable: true,
          value: { ...e.target, value: sanitizedValue }
        });
        onChange(e);
      }
    };
    
    return (
      <textarea
        dir="ltr"
        lang="en"
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{ direction: 'ltr', textAlign: 'left', ...style }}
        value={cleanValue}
        defaultValue={cleanDefaultValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
