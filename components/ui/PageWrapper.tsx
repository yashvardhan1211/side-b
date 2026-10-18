interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export default function PageWrapper({ children, className = "", narrow = false }: PageWrapperProps) {
  return (
    <main
      className={`flex-1 w-full mx-auto px-5 md:px-8 py-8 md:py-12 ${
        narrow ? "max-w-content" : "max-w-wide"
      } ${className}`}
    >
      {children}
    </main>
  );
}
