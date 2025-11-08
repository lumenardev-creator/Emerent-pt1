import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { KioskLayout } from "./components/KioskLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import KioskManagement from "./pages/KioskManagement";
import Redistribution from "./pages/Redistribution";
import Transactions from "./pages/Transactions";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import KioskLogin from "./pages/KioskLogin";
import KioskDashboard from "./pages/kiosk/KioskDashboard";
import KioskInventory from "./pages/kiosk/KioskInventory";
import KioskRequests from "./pages/kiosk/KioskRequests";
import KioskTransactions from "./pages/kiosk/KioskTransactions";
import KioskSettings from "./pages/kiosk/KioskSettings";
import KioskThresholdSettings from "./pages/kiosk/KioskThresholdSettings";
import DemoSetup from "./pages/DemoSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/demo-setup" element={<DemoSetup />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/kiosk-login" element={<KioskLogin />} />
              
              {/* Admin Routes */}
              <Route path="/" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Dashboard /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Inventory /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk-management" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><KioskManagement /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/redistribution" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Redistribution /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Transactions /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Alerts /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute requireRole="admin">
                  <Layout><Settings /></Layout>
                </ProtectedRoute>
              } />
              
              {/* Kiosk Routes */}
              <Route path="/kiosk" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskDashboard /></KioskLayout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk/inventory" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskInventory /></KioskLayout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk/requests" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskRequests /></KioskLayout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk/transactions" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskTransactions /></KioskLayout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk/settings" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskSettings /></KioskLayout>
                </ProtectedRoute>
              } />
              <Route path="/kiosk/threshold-settings" element={
                <ProtectedRoute requireRole="kiosk_user">
                  <KioskLayout><KioskThresholdSettings /></KioskLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
