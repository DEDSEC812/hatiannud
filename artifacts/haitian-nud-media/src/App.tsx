import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Watch } from "@/pages/watch";
import { Search } from "@/pages/search";
import { Plans } from "@/pages/plans";
import { Account } from "@/pages/account";
import { Admin } from "@/pages/admin";
import { Legal } from "@/pages/legal";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.jpg`,
  },
  variables: {
    colorPrimary: "hsl(222, 100%, 56%)",
    colorForeground: "hsl(0, 0%, 100%)",
    colorMutedForeground: "hsl(230, 15%, 65%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(232, 30%, 6%)",
    colorInput: "hsl(230, 20%, 15%)",
    colorInputForeground: "hsl(0, 0%, 100%)",
    colorNeutral: "hsl(230, 20%, 15%)",
    colorModalBackdrop: "rgba(0,0,0,0.8)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden border border-border shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-serif font-bold text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/80 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive-foreground",
    logoBox: "hidden",
    logoImage: "hidden",
    socialButtonsBlockButton: "border-border hover:bg-accent text-foreground",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
    formFieldInput: "bg-input border-border text-foreground focus:ring-primary",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "bg-destructive/20 border-destructive",
    otpCodeFieldInput: "border-border bg-input text-foreground",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6 flex items-start justify-center sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest">
            HN
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">HAITIAN NUD</h1>
          <p className="mt-2 text-sm text-muted-foreground">Connexion simple et rapide</p>
        </div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6 flex items-start justify-center sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-2xl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest">
            HN
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">HAITIAN NUD</h1>
          <p className="mt-2 text-sm text-muted-foreground">Créer ton compte en quelques secondes</p>
        </div>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Bon retour",
            subtitle: "Connectez-vous à votre compte",
          },
        },
        signUp: {
          start: {
            title: "Créer un compte",
            subtitle: "Rejoignez la communauté",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/watch/:id" component={Watch} />
            <Route path="/search" component={Search} />
            <Route path="/plans" component={Plans} />
            <Route path="/account" component={Account} />
            <Route path="/admin" component={Admin} />
            <Route path="/legal" component={Legal} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route>
              <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
                <div className="mb-4 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  404
                </div>
                <h1 className="text-3xl font-serif font-bold">Page introuvable</h1>
                <p className="mt-2 max-w-md text-muted-foreground">La page que tu cherches n'existe pas. Retourne à l'accueil.</p>
                <a href={basePath || "/"} className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
                  Aller à l'accueil
                </a>
              </div>
            </Route>
          </Switch>
        </Layout>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster theme="dark" />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
