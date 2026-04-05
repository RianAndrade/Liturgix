interface PageErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function PageError({ message = "Erro ao carregar dados.", onRetry }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
