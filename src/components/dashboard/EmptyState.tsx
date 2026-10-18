interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="state-box" role="status">
      <p className="state-title">{title}</p>
      {description ? <p className="state-desc">{description}</p> : null}
    </div>
  );
}
