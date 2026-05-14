import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StaffAuthProvider, useStaffAuth } from "./contexts/StaffAuthContext";
import AppLayout from "./components/AppLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import OrdersListPage from "./pages/OrdersListPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CalendarPage from "./pages/CalendarPage";
import CustomerQueryPage from "./pages/CustomerQueryPage";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AdminFlowersPage from "./pages/admin/AdminFlowersPage";
import AdminRegionsPage from "./pages/admin/AdminRegionsPage";
import AdminCapacitiesPage from "./pages/admin/AdminCapacitiesPage";
import AdminBankAccountsPage from "./pages/admin/AdminBankAccountsPage";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useStaffAuth();
  const [location] = useLocation();

  // Customer query page is always accessible
  if (location === "/query") {
    return <CustomerQueryPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFD6C0" }}>
        <div className="bg-white border-[3px] border-black rounded-2xl shadow-[6px_6px_0px_#111] p-10 text-center">
          <div className="text-5xl mb-4 animate-bounce">🌸</div>
          <p className="font-black text-xl uppercase tracking-widest">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/query" component={CustomerQueryPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/orders/create" component={CreateOrderPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/orders" component={OrdersListPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/query" component={CustomerQueryPage} />
        {isAdmin && <Route path="/admin/staff" component={AdminStaffPage} />}
        {isAdmin && <Route path="/admin/flowers" component={AdminFlowersPage} />}
        {isAdmin && <Route path="/admin/regions" component={AdminRegionsPage} />}
        {isAdmin && <Route path="/admin/capacities" component={AdminCapacitiesPage} />}
        {isAdmin && <Route path="/admin/bank-accounts" component={AdminBankAccountsPage} />}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <StaffAuthProvider>
            <Router />
          </StaffAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
