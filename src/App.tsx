
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Login from "./pages/Login";
import MyPurchases from "./pages/MyPurchases";
import AdminDeliver from "./pages/AdminDeliver";
import OrdersHistory from "./pages/OrdersHistory";
import UsersList from "./pages/UsersList";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Product from "./pages/Product";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <meta name="yandex-verification" content="bc4ced2e8c5210d7" />
        </Helmet>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/5-klass" element={<Index initialCategory="5 класс" />} />
            <Route path="/6-klass" element={<Index initialCategory="6 класс" />} />
            <Route path="/7-klass" element={<Index initialCategory="7 класс" />} />
            <Route path="/8-klass" element={<Index initialCategory="8 класс" />} />
            <Route path="/9-klass" element={<Index initialCategory="9 класс" />} />
            <Route path="/10-klass" element={<Index initialCategory="10 класс" />} />
            <Route path="/11-klass" element={<Index initialCategory="11 класс" />} />
            <Route path="/oge" element={<Index initialCategory="ОГЭ" />} />
            <Route path="/ege" element={<Index initialCategory="ЕГЭ" />} />
            <Route path="/auth-9x2k7p" element={<Login />} />
            <Route path="/admin-login-x9p2k7" element={<AdminLogin />} />
            <Route path="/admin-x9p2k7" element={<Admin />} />
            <Route path="/my-purchases" element={<MyPurchases />} />
            <Route path="/admin-deliver" element={<AdminDeliver />} />
            <Route path="/orders-history" element={<OrdersHistory />} />
            <Route path="/users-list" element={<UsersList />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/product/:id" element={<Product />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;