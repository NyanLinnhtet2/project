import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Users, TrendingUp, CheckCircle, Sparkles, Building2, Package, ShoppingCart } from "lucide-react";

export function Hero() {
  const features = [
    { icon: Shield, label: "လုံခြုံစိတ်ချရခြင်း", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: Zap, label: "အမြန်နှုန်းမြင့်မားခြင်း", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: Users, label: "အသုံးပြုရလွယ်ကူခြင်း", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: TrendingUp, label: "ထိရောက်သောစီမံခန့်ခွဲမှု", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const stats = [
    { label: "Active Users", value: "2,500+", icon: Users },
    { label: "Branches", value: "50+", icon: Building2 },
    { label: "Products", value: "10K+", icon: Package },
    { label: "Daily Orders", value: "1,200+", icon: ShoppingCart },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl animate-pulse"></div>
        <div className="absolute top-60 -left-40 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-20 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-blue-100/10 blur-3xl"></div>
      </div>

      <div className="relative w-full mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-50 to-indigo-50 px-5 py-2 text-sm font-medium text-blue-700 shadow-sm border border-blue-100/50">
            <Sparkles size={16} className="text-blue-500" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Smart • Simple • Synchronized
          </div>

          {/* Main Heading */}
          <div className="mt-8 max-w-5xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.15]">
              <span className="block text-slate-900">
                Distributed
              </span>
              <span className="block bg-linear-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                Clothing Shop
              </span>
              <span className="block text-slate-900 mt-2">
                Management System
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              ကုန်ပစ္စည်းများ၊ အော်ဒါများနှင့် Branch Operations များကို တစ်နေရာတည်းမှ 
              <span className="text-blue-600 font-semibold"> အဆင်ပြေချောမွေ့စွာ </span> 
              စီမံခန့်ခွဲလိုက်ပါ။
            </p>
            <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              Real-time synchronization၊ စမတ်ကျသော ကုန်ပစ္စည်းလက်ကျန် စီမံခန့်ခွဲမှုနှင့် 
              တိကျသေချာသော လုပ်ငန်းသုံးအစီရင်ခံစာများ
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
            >
              အသုံးပြုရန် စတင်မည်
              <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:bg-white hover:shadow-md active:scale-95"
            >
              ပိုမိုလေ့လာရန်
            </Link>
          </div>

          {/* Features Grid */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl w-full">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="group flex flex-col items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm p-5 shadow-sm border border-slate-100/50 transition-all hover:shadow-md hover:bg-white hover:-translate-y-1"
                >
                  <div className={`rounded-xl ${feature.bg} p-2.5 transition-all group-hover:scale-110`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 text-center leading-tight">
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-4xl w-full">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="group text-center transition-all hover:-translate-y-1"
                >
                  <div className="flex justify-center mb-3">
                    <div className="rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 p-3 transition-all group-hover:shadow-md group-hover:scale-110">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Free Updates</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>Data Backup</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse { animation: pulse 4s ease-in-out infinite; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </section>
  );
}