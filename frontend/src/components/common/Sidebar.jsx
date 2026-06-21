import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, User, FileText, ClipboardCheck, 
  TrendingUp, Database, CheckSquare, GraduationCap, X, GraduationCap as AppLogo,
  History
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

// Icon mapping configuration based on role links
const navigationMap = {
  admin: [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Academic Setup', path: '/admin/academic', icon: Database },
    { name: 'Exams', path: '/admin/exams', icon: FileText },
    { name: 'Results', path: '/admin/results', icon: ClipboardCheck },
    { name: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: History },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Question Bank', path: '/teacher/questions', icon: Database },
    { name: 'Exams', path: '/teacher/exams', icon: FileText },
    { name: 'Evaluation', path: '/teacher/evaluation', icon: CheckSquare },
    { name: 'Results', path: '/teacher/results', icon: ClipboardCheck },
    { name: 'Analytics', path: '/teacher/analytics', icon: TrendingUp },
  ],
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Exams', path: '/student/exams', icon: FileText },
    { name: 'Results', path: '/student/results', icon: ClipboardCheck },
    { name: 'Analytics', path: '/student/analytics', icon: TrendingUp },
    { name: 'Profile', path: '/student/profile', icon: User },
  ],
};

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';
  const links = navigationMap[role] || [];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-950/20 backdrop-blur-xs md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-neutral-200 bg-white flex flex-col transition-transform duration-200 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header Brand */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-neutral-100 rounded-lg text-neutral-900 border border-neutral-200/50">
              <AppLogo className="w-5 h-5" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-neutral-900">
              ExamPortal
            </span>
          </div>
          {/* Mobile close button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg md:hidden cursor-pointer border border-transparent"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)} // Close sidebar on click in mobile
                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-[10px] transition-all duration-150 group cursor-pointer ${
                  isActive 
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform duration-150" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Role Identifier */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {role} Workspace
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
