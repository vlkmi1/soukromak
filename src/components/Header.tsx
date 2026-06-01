import Link from "next/link";
import { Fish, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="container">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-bold text-2xl text-primary hover:text-primary/80 transition-colors">
            <Fish className="h-8 w-8" />
            <span>Rybník Ostrata</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              O nás
            </Link>
            <Link href="/rezervace" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Rezervace
            </Link>
            
            {/* Informace Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-base font-medium text-foreground hover:text-primary transition-colors outline-none">
                INFORMACE
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/#cenik" className="w-full cursor-pointer">
                    Ceník
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/#podminky" className="w-full cursor-pointer">
                    Podmínky rybolovu
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/#zavody" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Závody
            </Link>
            <Link href="/#foto" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Foto
            </Link>
            <Link href="/#kontakt" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Kontakt
            </Link>
            <Link href="/admin" className="text-base font-medium text-secondary hover:text-primary transition-colors">
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-6 border-t space-y-4">
            <Link href="/" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              Aktuality
            </Link>
            <Link href="/#o-nas" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              O nás
            </Link>
            <Link href="/rezervace" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              Rezervace
            </Link>
            <div className="space-y-2">
              <div className="text-base font-medium text-foreground">INFORMACE</div>
              <div className="pl-4 space-y-2">
                <Link href="/#cenik" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Ceník
                </Link>
                <Link href="/#podminky" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Podmínky rybolovu
                </Link>
              </div>
            </div>
            <Link href="/#zavody" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              Závody
            </Link>
            <Link href="/#foto" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              Foto
            </Link>
            <Link href="/#kontakt" className="block text-base font-medium text-foreground hover:text-primary transition-colors">
              Kontakt
            </Link>
            <Link href="/admin" className="block text-base font-medium text-secondary hover:text-primary transition-colors">
              Admin
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}