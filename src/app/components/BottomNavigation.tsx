import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Calendar,
  // Bell,
  FileText,
  User,
  Plane,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/attendance", icon: Calendar, label: "Attendance" },
  { path: "/leave", icon: Plane, label: "Leave" },
  // { path: "/notifications", icon: Bell, label: "Alerts" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 transition-colors ${
                  isActive
                    ? "text-[#1A2B3C]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-1 ${
                    isActive ? "fill-[#1A2B3C]" : ""
                  }`}
                />
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}