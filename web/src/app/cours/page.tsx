import { Suspense } from "react";
import { Catalog } from "./Catalog";
import { Skeleton } from "@/components/ui";

export const metadata = { title: "Cours · الدروس — codemaroc" };

export default function CoursPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Catalog />
    </Suspense>
  );
}
