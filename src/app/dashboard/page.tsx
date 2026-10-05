import { Metadata } from "next";
import { BalanceCards } from "./_components/balance-cards";

export const metadata: Metadata = {
  title: "Pefire - Dashboard",
  description: "Your personal financial dashboard",
};

export default function DashboardPage() {
  return (
    <div className="p-2 space-y-4">
      <section id="header">
        <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
        <p>
          Get insight into spending, track your expenses, and manage your
          finances
        </p>
      </section>
      <section id="content">
        <BalanceCards />
      </section>
    </div>
  );
}
