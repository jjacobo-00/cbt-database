import React from "react";
import { LoginTabs } from "@/components/auth/LoginTabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-[420px] shadow-xl border border-border/80">
        <CardHeader className="space-y-2 items-center text-center pb-4">
          <div className="flex items-center justify-center p-2 rounded-2xl bg-primary/10 border border-primary/20">
            <Image
              src="/logo.svg"
              alt="CBT Logo"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              CBT Portal
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Christian Baptist Tabernacle Database
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resolvedSearchParams?.info === "session_expired" && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
              Your session has expired after 12 hours. Please sign in again.
            </div>
          )}

          {resolvedSearchParams?.error && (
            <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
              {resolvedSearchParams.error}
            </div>
          )}

          <LoginTabs />
        </CardContent>
      </Card>
    </div>
  );
}
