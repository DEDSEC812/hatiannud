import { Link, useLocation } from "wouter";
import { Search, Home, Star, User, Menu } from "lucide-react";
import { SignInButton, SignOutButton, useUser, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { PwaInstallButton } from "@/components/pwa-install";

export function Header() {
  const { isSignedIn, user } = useUser();
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] border-r-border">
              <SheetHeader>
                <SheetTitle className="text-left font-serif text-xl">HAITIAN NUD</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Home className="h-5 w-5" /> Accueil
                </Link>
                <Link href="/search" className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Search className="h-5 w-5" /> Recherche
                </Link>
                <Link href="/plans" className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                  <Star className="h-5 w-5" /> Devenir VIP
                </Link>
                <div className="mt-4 pt-4 border-t border-border">
                  {isSignedIn ? (
                    <>
                      <Link href="/account" className="flex items-center gap-3 px-2 py-2 text-lg hover:text-primary transition-colors">
                        <User className="h-5 w-5" /> Mon Compte
                      </Link>
                      <div className="px-2 mt-4">
                        <SignOutButton>
                          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                            Déconnexion
                          </Button>
                        </SignOutButton>
                      </div>
                    </>
                  ) : (
                    <SignInButton mode="modal">
                      <Button className="w-full">Connexion</Button>
                    </SignInButton>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <img src={`${basePath}/logo.jpg`} alt="Logo" className="h-8 w-8 rounded object-cover" />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
              HAITIAN NUD
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            Accueil
          </Link>
          <Link href="/search" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/search' ? 'text-primary' : 'text-muted-foreground'}`}>
            Recherche
          </Link>
          <Link href="/plans" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/plans' ? 'text-primary' : 'text-muted-foreground'}`}>
            VIP
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/search" className="md:hidden text-muted-foreground hover:text-primary">
            <Search className="h-5 w-5" />
          </Link>
          <div className="hidden md:block"><PwaInstallButton /></div>
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/account" className="hidden sm:block">
                <Button variant="ghost" size="sm">Compte</Button>
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
            </div>
          ) : (
            <SignInButton mode="modal">
              <Button size="sm" className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground">
                Connexion
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
