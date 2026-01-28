import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { LogOut, Loader2 } from 'lucide-react'; // เพิ่มไอคอนโหลด

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // สำหรับตอนเปิดเว็บครั้งแรก
  const [isProcessing, setIsProcessing] = useState(false); // ✅ สำหรับตอน Login/Logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

useEffect(() => {
  const savedUser = localStorage.getItem('user');

  if (savedUser && savedUser !== "undefined") {
    try {
      const parsedUser = JSON.parse(savedUser);

      // ✅ เช็คว่าเป็น ADMIN เท่านั้น
      if (parsedUser.role === 'ADMIN') {
        setUser(parsedUser);
      } else {
        localStorage.removeItem('user');
      }
    } catch (error) {
      localStorage.removeItem('user');
    }
  }

  setLoading(false);
}, []);


  // ✅ ฟังก์ชันตอนเข้าสู่ระบบ (หน่วงเวลา 1.5 วิ)
const handleLogin = (userData) => {
  if (userData.role !== 'ADMIN') {
    alert('บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ');
    return;
  }

  setIsProcessing(true);
  setTimeout(() => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsProcessing(false);
  }, 1500);
};

  // ✅ ฟังก์ชันตอนออกจากระบบ (หน่วงเวลา 1.5 วิ)
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setIsProcessing(true);
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('user');
      setIsProcessing(false);
    }, 1500);
  };

  if (loading) return null;

  return (
    <Router>
      {/* --- 🌀 หน้าจอ Loading Overlay (โชว์ตอนเปลี่ยนสถานะ) --- */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="relative">
            <Loader2 size={64} className="animate-spin text-indigo-500" />
            <div className="absolute inset-0 blur-2xl bg-indigo-500/20 rounded-full"></div>
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-widest uppercase">
            {user ? 'กำลังออกจากระบบ...' : 'กำลังเข้าสู่ระบบ...'}
          </h2>
          <p className="mt-2 text-slate-400 text-sm animate-pulse">กรุณารอสักครู่</p>
        </div>
      )}

      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />

        <Route 
          path="/*" 
          element={
            user ? (
              <div className="flex h-screen overflow-hidden bg-slate-100">
                <Sidebar user={user} onLogout={() => setShowLogoutConfirm(true)} />
                <div className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<POS />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Routes>
                </div>

                {/* --- 📢 กล่องยืนยันการออกจากระบบ --- */}
                {showLogoutConfirm && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
                    <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
                      <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LogOut size={40} className="text-rose-500" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2">ยืนยันการออก?</h3>
                      <p className="text-slate-500 mb-8 font-medium">ระบบจะบันทึกสถานะล่าสุดของคุณไว้</p>
                      <div className="flex gap-4">
                        <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">ยกเลิก</button>
                        <button onClick={handleLogout} className="flex-1 py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl transition-all">ยืนยัน</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;