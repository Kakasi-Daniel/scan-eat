import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import TableLanding from "@/pages/TableLanding";
import Menu from "@/pages/Menu";
import Order from "@/pages/Order";
import ReceiptPage from "@/pages/ReceiptPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/table/:tableId" element={<TableLanding />} />
        <Route path="/table/:tableId/menu" element={<Menu />} />
        <Route path="/table/:tableId/order" element={<Order />} />
        <Route path="/receipt/:orderId" element={<ReceiptPage />} />
      </Routes>
    </BrowserRouter>
  );
}
