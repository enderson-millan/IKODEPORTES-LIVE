/* eslint-disable prettier/prettier */
import { Heart } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-accent px-3 py-2">
      <p className="flex flex-wrap items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
        <span>© {new Date().getFullYear()}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          Feito com <Heart className="h-3 w-3 fill-red-500 text-red-500" aria-hidden="true" /> por
        </span>
        <Link
          href="https://endersonmillan.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline transition-colors hover:text-foreground"
        >
          Eng.
        </Link>
        <Link
          href="https://github.com/ENDERSON-MARIN"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline transition-colors hover:text-foreground"
        >
          Enderson
        </Link>
        <Link
          href="https://www.linkedin.com/in/enderson-millan"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline transition-colors hover:text-foreground"
        >
          Millán
        </Link>
      </p>
    </footer>
  );
}
