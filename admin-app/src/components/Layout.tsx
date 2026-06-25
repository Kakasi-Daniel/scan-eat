import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  ShoppingCart,
  LogOut,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { to: "/tables", icon: Grid3X3, label: "Tables" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
];

export default function Layout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-zinc-50">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900">Scan Eat</h2>
              <p className="text-xs text-zinc-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-50 text-orange-700"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-500 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
