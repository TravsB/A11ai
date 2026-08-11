import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Studio from "@/pages/Studio";
import Docs from "@/pages/Docs";
import Palette from "@/pages/Palette";
import Guide from "@/pages/Guide";
import Preferences from "@/pages/Preferences";
import Report from "@/pages/Report";
import Audit from "@/pages/Audit";
import ApiKeys from "@/pages/ApiKeys";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: () => React.ReactElement }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/sign-in");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-ink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <Component />;
}

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/sign-in" component={SignIn} />
          <Route path="/sign-up" component={SignUp} />
          <Route path="/studio" component={Studio} />
          <Route path="/docs" component={Docs} />
          <Route path="/palette" component={Palette} />
          <Route path="/guide" component={Guide} />
          <Route path="/preferences" component={Preferences} />
          <Route path="/report/:id" component={Report} />
          <Route path="/audit" component={() => <ProtectedRoute component={Audit} />} />
          <Route path="/api-keys" component={() => <ProtectedRoute component={ApiKeys} />} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}
