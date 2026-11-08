import { Suspense } from "react";
import { Lesson } from "./Lesson";

export const metadata = { title: "Étape du parcours — Code Maroc" };

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="duo min-h-dvh" />}>
      <Lesson />
    </Suspense>
  );
}
