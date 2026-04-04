import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Chyba 404</p>
        <h1 className="text-2xl font-bold text-foreground">
          Tato stránka neexistuje
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Zkontrolujte adresu v prohlížeči, nebo pokračujte na úvod či do průvodce
          studie dopadů.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/">Na úvod</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/studio">Průvodce</Link>
        </Button>
      </div>
    </main>
  );
}
