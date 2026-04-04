"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-background font-sans antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Aplikace narazila na vážnou chybu
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Obnovte stránku. Pokud se chyba opakuje, zkuste vymazat mezipaměť
              prohlížeče nebo otevřít aplikaci v novém okně.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="mx-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Zkusit znovu
          </button>
        </main>
      </body>
    </html>
  );
}
