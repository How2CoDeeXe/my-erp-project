import { useState } from 'react';
import api from '../services/api';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

function Login({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await api.post('/login', { email, password });
      if (res.data.user) {
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans antialiased relative overflow-hidden">
      
      {/* 🖼️ ภาพพื้นหลัง (Professional Dark Cafe) */}
      <div className="fixed inset-0 z-0">
        <img 
          src="http://googleusercontent.com/image_generation_content/1" 
          alt="Luxury Cafe Background" 
          className="w-full h-full object-cover scale-105"
        />
        {/* Layer สีเข้มและ Gradient ทับภาพเพื่อให้ฟอร์มดูเด่นขึ้น */}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-transparent to-slate-950/40"></div>
      </div>

      {/* 💳 Login Card (ดีไซน์กระจกฝ้าพรีเมียม) */}
      <div className="max-w-[1000px] w-full bg-white/90 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:flex-row min-h-[600px] relative z-10 border border-white/30 backdrop-blur-xl">
        
        {/* --- ฝั่งซ้าย: Branding & Visual (Midnight Blue Overlay) --- */}
        <div className="md:w-[45%] bg-[#0F172A]/85 p-12 flex flex-col justify-between text-white relative border-r border-white/10">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-12">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black tracking-[0.1em] uppercase text-indigo-200">Secure Enterprise POS</span>
            </div>

            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/40">
              <Coffee size={32} className="text-white" />
            </div>
            
            <h1 className="text-4xl font-black mb-4 leading-tight tracking-tighter">
              Manage your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Coffee Business</span> <br />
              like a Pro.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] font-medium opacity-80">
              ระบบจัดการร้านกาแฟอัจฉริยะ ช่วยให้การทำธุรกิจของคุณง่าย รวดเร็ว และแม่นยำยิ่งขึ้น
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">V2</div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">System 2026</p>
                <p className="text-[10px] text-slate-500 font-bold">Status: Online & Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- ฝั่งขวา: Login Form --- */}
        <div className="md:w-[55%] p-12 md:p-20 flex flex-col justify-center bg-white/40">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">System Login</h2>
            <div className="h-1.5 w-12 bg-indigo-600 rounded-full"></div>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50/80 backdrop-blur-md border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-black">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Access</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  name="email"
                  type="email" 
                  required
                  defaultValue="boss@erp.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300" 
                  placeholder="admin@coffeebar.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Master Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  name="password"
                  type="password" 
                  required
                  defaultValue="123"
                  className="w-full pl-12 pr-4 py-4 bg-white/80 border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-300" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-600 shadow-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>SIGN IN TO SYSTEM</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;