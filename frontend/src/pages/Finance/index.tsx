import React, { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  Users,
} from "lucide-react";
import DashboardView from "./views/DashboardView";
import TransactionsView from "./views/TransactionsView";
import InvoicesView from "./views/InvoicesView";
import DebtorsView from "./views/DebtorsView";

type TabId = "dashboard" | "transactions" | "invoices" | "debtors";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Обзор", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "transactions", label: "Транзакции", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { id: "invoices", label: "Накладные", icon: <FileText className="h-4 w-4" /> },
  { id: "debtors", label: "Дебиторы", icon: <Users className="h-4 w-4" /> },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Финансы</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Finance tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "transactions" && <TransactionsView />}
        {activeTab === "invoices" && <InvoicesView />}
        {activeTab === "debtors" && <DebtorsView />}
      </div>
    </div>
  );
}
