import { Link } from "wouter";
import { Instagram, Music2, MessageCircle, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaInstallButton } from "@/components/pwa-install";

const SITE_URL = "https://www.haitiennud.com";

export function Footer() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <footer className="w-full border-t border-border bg-card text-card-foreground py-12 pb-24 md:pb-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <img src={`${basePath}/logo.jpg`} alt="Haïtien Nud Média" className="h-10 w-10 rounded object-cover" />
            <span className="font-serif font-bold text-2xl tracking-tight">Haïtien Nud Média</span>
          </Link>
          <div className="mb-6" />

          <div className="flex flex-wrap gap-3 mb-4">
            <a href="https://instagram.com/haitiennud" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://tiktok.com/@haitiennud" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Music2 className="h-4 w-4" />
            </a>
            <a href="https://t.me/dg_haitiannud" target="_blank" rel="noopener noreferrer" aria-label="Telegram Groupe 1" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Send className="h-4 w-4" />
            </a>
            <a href="https://t.me/hatiannud_canal" target="_blank" rel="noopener noreferrer" aria-label="Telegram Canal" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Send className="h-4 w-4" />
            </a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10 w-full sm:w-auto">
                <Globe className="h-4 w-4 mr-2" /> www.haitiennud.com
              </Button>
            </a>
            <PwaInstallButton />
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Navigation</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Accueil</Link></li>
            <li><Link href="/search" className="text-muted-foreground hover:text-primary transition-colors">Recherche</Link></li>
            <li><Link href="/plans" className="text-muted-foreground hover:text-primary transition-colors">Devenir VIP</Link></li>
            <li><Link href="/account" className="text-muted-foreground hover:text-primary transition-colors">Mon Compte</Link></li>
          </ul>

          <h4 className="font-semibold mt-6 mb-4">Communauté Telegram</h4>
          <ul className="space-y-2">
            <li><a href="https://t.me/dg_haitiannud" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Groupe 1</a></li>
            <li><a href="https://t.me/+UXtFEcF2Dw8zNGYx" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Groupe 2</a></li>
            <li><a href="https://t.me/hatiannud_canal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Canal 1</a></li>
            <li><a href="https://t.me/haiti_annud" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Canal 2</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Légal</h4>
          <ul className="space-y-2">
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
            <li><Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">Mentions légales</Link></li>
            <li><span className="text-muted-foreground text-sm mt-4 block">Réservé aux adultes (18+)</span></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© 2026 Haïtien Nud Média. Tous droits réservés.</p>
        <p>Made for the Diaspora & the Island</p>
      </div>
    </footer>
  );
}
