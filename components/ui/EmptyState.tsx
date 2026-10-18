interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6 border"
      style={{
        borderColor: "var(--color-dust-border)",
        borderStyle: "dashed",
        borderRadius: "2px",
      }}
    >
      <div
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center mb-4"
        style={{ borderColor: "var(--color-dust)" }}
      >
        <span style={{ color: "var(--color-dust)", fontSize: "0.75rem" }}>○</span>
      </div>
      <h3
        className="font-serif text-xl font-bold mb-2"
        style={{ color: "var(--color-ink)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-sm max-w-xs"
          style={{ color: "var(--color-dust)" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
