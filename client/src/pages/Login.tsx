// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authServices";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Store,
  Shield,
  TrendingUp,
  CheckCircle,
  Building2,
  Package,
  ShoppingCart,
  Users,
  Database,
  Cloud,
  Wifi,
  Server,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email နှင့် Password ထည့်သွင်းရန် လိုအပ်ပါသည်။");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      localStorage.setItem("userInfo", JSON.stringify(response.user));

      toast.success(`${response.message}`);

      if (response.user.role === "admin") {
        navigate("/admin/overviews");
      } else if (response.user.role === "manager") {
        navigate("/");
      } else if (response.user.role === "cashier") {
        navigate("/about");
      } else {
        navigate("/overviews");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login ဝင်ရာတွင် အမှားရှိနေပါသည်။");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Package,
      label: "ကုန်ပစ္စည်းစီမံခန့်ခွဲခြင်း",
      desc: "ကုန်ပစ္စည်းများကို လွယ်ကူစွာ စီမံနိုင်သည်",
    },
    {
      icon: Building2,
      label: "Branch များကို စီမံခန့်ခွဲခြင်း",
      desc: "Branch များကို ချိတ်ဆက်စီမံနိုင်သည်",
    },
    {
      icon: TrendingUp,
      label: "အရောင်းစာရင်းများ ကြည့်ရှုနိုင်ခြင်း",
      desc: "အရောင်းစာရင်းနှင့် Report များကို ကြည့်ရှုနိုင်သည်",
    },
    {
      icon: Database,
      label: "Data Synchronization",
      desc: "Branch များအကြား Data Synchronization ဆောင်ရွက်သည်",
    },
  ];

  const stats = [
    {
      label: "Branches Connected",
      value: "3",
      icon: Building2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Products Managed",
      value: "1000+",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Orders Processed",
      value: "50K+",
      icon: ShoppingCart,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Active Users",
      value: "20+",
      icon: Users,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo != null) {
      navigate("/admin/overviews");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-50 to-indigo-50 px-5 py-2 text-sm font-medium text-blue-700 shadow-sm border border-blue-100/50 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Smart • Simple • Synchronized
            </div>

            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]">
              <span className="block text-slate-900">Distributed</span>
              <span className="block bg-linear-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Clothing Shop
              </span>
              <span className="block text-slate-900">Management System</span>
            </h2>

            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
              အဝတ်အထည်ဆိုင်များကို တစ်နေရာတည်းမှ စီမံခန့်ခွဲနိုင်ပြီး
              ကုန်ပစ္စည်းများ၊ အရောင်းအဝယ်များ၊ လက်ကျန်ပစ္စည်းများနှင့်
              အစီရင်ခံစာများကို လွယ်ကူစွာ စီမံနိုင်ပါသည်။
            </p>

            {/* Features List */}
            <div className="mt-8 space-y-4 max-w-lg">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex gap-4 items-start group">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 shadow-sm transition-all group-hover:shadow-md group-hover:scale-105">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm md:text-base">
                        {feature.label}
                      </h4>
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Image Banner */}
            <div className="mt-8 rounded-2xl overflow-hidden relative max-w-xl h-48 border border-slate-200/60 shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800"
                alt="Shop Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/20 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span>Connected with 3+ branches</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60">
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200">
                  <Store size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  အကောင့်ဝင်ရန်
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  သင့်အကောင့်ဖြင့် Login ဝင်ပါ။
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                  <span className="text-red-500">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="admin@gmail.com"
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm font-medium">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    Remember Me
                  </label>
                  <a
                    href="#forgot"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    စကားဝှက်မေ့နေပါသလား?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full cursor-pointer mt-2 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all ${
                    loading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      ဝင်ရောက်နေသည်...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      အကောင့်ဝင်ရန်
                    </>
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-slate-600 flex gap-3 leading-relaxed">
                <div className="text-blue-600 shrink-0 mt-0.5">
                  <Shield size={16} />
                </div>
                <p>
                  အကောင့်အသစ်ဖွင့်၍ မရပါ။ အသုံးပြုမည့်အကောင့်ကို{" "}
                  <span className="font-bold text-slate-900">
                    System Administrator
                  </span>{" "}
                  မှသာ ဖန်တီးပေးပါမည်။
                </p>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-400">
                <div className="h-px bg-slate-200 w-full" />
                <span className="shrink-0 font-medium">သို့မဟုတ်</span>
                <div className="h-px bg-slate-200 w-full" />
              </div>

              {/* Tech Stack */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                  <Cloud size={14} className="text-blue-500" />
                  <span>Cloud</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                  <Wifi size={14} className="text-emerald-500" />
                  <span>Sync</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
                  <Server size={14} className="text-purple-500" />
                  <span>Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3">
                  <div
                    className={`rounded-xl ${stat.color} p-3 transition-all group-hover:scale-110 group-hover:shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
          {[
            {
              icon: Package,
              label: "Inventory Control",
              desc: "Real-time inventory management",
            },
            {
              icon: Database,
              label: "Branch Sync",
              desc: "Seamless data synchronization",
            },
            {
              icon: ShoppingCart,
              label: "Order Management",
              desc: "Fast and accurate orders",
            },
            {
              icon: TrendingUp,
              label: "Reports & Analytics",
              desc: "Powerful insights",
            },
            {
              icon: Shield,
              label: "Secure & Reliable",
              desc: "Enterprise-grade security",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="text-center p-4 bg-white rounded-2xl border border-slate-100/50 transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex justify-center mb-3">
                  <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {item.label}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
