import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useMenuStore } from "@/stores/menuStore";
import { useTableStore } from "@/stores/tableStore";
import { useOrderStore } from "@/stores/orderStore";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MenuManagement from "@/pages/MenuManagement";
import TableManagement from "@/pages/TableManagement";
import OrderManagement from "@/pages/OrderManagement";
import OrderDetail from "@/pages/OrderDetail";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const { init, user } = useAuthStore();
  const { listen: listenMenu } = useMenuStore();
  const { listen: listenTables } = useTableStore();
  const { listen: listenOrders } = useOrderStore();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user) {
      listenMenu();
      listenTables();
      listenOrders();
    }
  }, [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/tables" element={<TableManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
