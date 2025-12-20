import * as React from "react"

import { cn } from "@/lib/utils"
import { stripRTL } from "@/utils/strip-rtl"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, onChange, value, defaultValue, ...props }, ref) => {
    // Strip RTL characters from controlled value
    const cleanValue = typeof value === 'string' ? stripRTL(value) : value;
    const cleanDefaultValue = typeof defaultValue === 'string' ? stripRTL(defaultValue) : defaultValue;
    
    // Wrap onChange to strip RTL characters from input
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <input
        type={type}
        dir="ltr"
        lang="en"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left', ...style }}
        value={cleanValue}
        defaultValue={cleanDefaultValue}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
