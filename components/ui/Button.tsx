import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth = false, className = "", children, disabled, ...props },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-mono tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxblood";

    const variants = {
      primary:
        "bg-ink text-paper hover:opacity-85",
      secondary:
        "bg-transparent border border-ink text-ink hover:bg-ink hover:text-paper",
      ghost:
        "bg-transparent text-ink hover:opacity-60",
      danger:
        "bg-oxblood text-paper hover:opacity-85",
    };

    const sizes = {
      sm: "text-2xs px-3 py-2",
      md: "text-xs px-5 py-3",
      lg: "text-xs px-8 py-4",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
