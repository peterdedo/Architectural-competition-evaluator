"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Něco se nepovedlo
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Stránku se nepodařilo zobrazit. Zkuste obnovit — pokud problém přetrvá,
          vraťte se na úvod nebo do průvodce. Vaše uložená data v prohlížeči
          obvykle zůstanou zachovaná.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Zkusit znovu
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Na úvod</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/studio">Do průvodce</Link>
        </Button>
      </div>
    </main>
  );
}
