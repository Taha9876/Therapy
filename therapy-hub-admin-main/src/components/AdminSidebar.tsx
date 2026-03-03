import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  LogOut,
  Brain,
} from "lucide-react";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/assessments", label: "MCQ & Assessments", icon: ClipboardList },
  { to: "/chat-monitor", label: "Chat Monitor", icon: MessageSquare },
];

const doctorLinks = [
  { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/patients", label: "My Patients", icon: Users },
  { to: "/doctor/appointments", label: "Appointments", icon: ClipboardList },
  { to: "/doctor/chat", label: "Chat", icon: MessageSquare },
];

const patientLinks = [
  { to: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/assessment", label: "Take Assessment", icon: ClipboardList },
  { to: "/patient/appointments", label: "Appointments", icon: Stethoscope },
  { to: "/patient/chat", label: "Chat with Doctor", icon: MessageSquare },
];

const AdminSidebar = () => {
  const { signOut, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  const links = role === "admin" ? adminLinks : role === "doctor" ? doctorLinks : patientLinks;
  const roleLabel = role === "admin" ? "Admin Panel" : role === "doctor" ? "Doctor Portal" : "Patient Portal";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Brain className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground">Smart Therapy</h1>
          <p className="text-xs text-sidebar-muted">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <button onClick={handleLogout} className="sidebar-link sidebar-link-inactive w-full">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
