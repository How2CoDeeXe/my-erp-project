import { useLocation, Link } from 'react-router-dom';
import { Store, LayoutDashboard, LogOut } from 'lucide-react';
import { User } from 'lucide-react';


function Sidebar({ user, onLogout }) {
  const location = useLocation();
  const menuItems = [
    { path: '/', icon: <Store size={24} />, label: 'หน้าร้าน (POS)' },
    { path: '/dashboard', icon: <LayoutDashboard size={24} />, label: 'หลังบ้าน (Dashboard)' },
  ];

  return (
    <div className="w-24 bg-slate-900 h-screen flex flex-col items-center py-8 gap-4 shadow-xl z-50">
      <div className="mb-4">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/50">
  <User size={24} />
</div>
      </div>
      
      {menuItems.map((item) => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group relative
            ${location.pathname === item.path ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/10 hover:text-white'}
          `}
        >
          {item.icon}
          <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {item.label}
          </span>
        </Link>
      ))}

      <button 
        onClick={onLogout}
        className="mt-auto w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group relative"
      >
        <LogOut size={24} />
      </button>
    </div>
  );
}

export default Sidebar;