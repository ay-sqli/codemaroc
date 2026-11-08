import { Suspense } from "react";
import { Session } from "./Session";

export const metadata = { title: "Session d'entraînement — Code Maroc" };

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="card mx-auto h-96 max-w-4xl animate-pulse" />}>
      <Session />
    </Suspense>
  );
}
