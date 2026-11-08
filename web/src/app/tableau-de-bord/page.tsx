import { Dashboard } from "../Dashboard";
import { BackButton } from "@/components/BackButton";

export const metadata = { title: "Tableau de bord — Code Maroc" };

export default function DashboardPage() {
  return (
    <>
      <BackButton className="mb-5" />
      <Dashboard />
    </>
  );
}
