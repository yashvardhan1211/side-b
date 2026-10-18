import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, id, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="label-caps block mb-2"
            style={{ color: "var(--color-dust)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-3 font-sans text-base bg-transparent border transition-colors
            placeholder:text-dust focus:outline-none focus-visible:ring-2 focus-visible:ring-oxblood
            ${error ? "border-oxblood" : "border-dust-border focus:border-ink"}
            ${className}`}
          style={{
            backgroundColor: "rgba(242,235,221,0.6)",
            borderRadius: "2px",
            color: "var(--color-ink)",
          }}
          {...props}
        />
        {error && (
          <p
            className="mt-1.5 text-xs font-mono"
            style={{ color: "var(--color-oxblood)" }}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
