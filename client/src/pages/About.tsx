import { Link } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Database, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Store,
  Wifi,
  Cloud,
  Server
} from "lucide-react";

export default function About() {
  const branches = [
    { city: "Yangon", location: "Downtown Hub", type: "Main Branch", color: "from-blue-500 to-blue-600" },
    { city: "Mandalay", location: "78th Street Showroom", type: "Sub Branch", color: "from-emerald-500 to-emerald-600" },
    { city: "Naypyitaw", location: "Thiri Yadanar Mall", type: "Sub Branch", color: "from-violet-500 to-violet-600" },
  ];

  const features = [
    {
      icon: Database,
      title: "Distributed Database",
      desc: "Local DB synchronization for offline operations",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      desc: "Enterprise-grade security with data encryption",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      desc: "Instant data synchronization across all branches",
      color: "text-violet-600",
      bg: "bg-violet-50"
    },
    {
      icon: Users,
      title: "Multi-user Access",
      desc: "Role-based access control for staff management",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
  ];

  const stats = [
    { label: "Active Branches", value: "3", icon: Building2 },
    { label: "Total Products", value: "1,248+", icon: Store },
    { label: "Daily Orders", value: "58+", icon: TrendingUp },
    { label: "Happy Customers", value: "2.5K+", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 py-20 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-50 to-indigo-50 px-5 py-2 text-sm font-medium text-blue-700 shadow-sm border border-blue-100/50 mb-6">
            <Globe size={16} className="text-blue-500" />
            About the System
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="block text-slate-900">Distributed</span>
            <span className="block bg-linear-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Clothing Shop System
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            ဒီစနစ်ဟာ ရန်ကုန်၊ မန္တလေး၊ နေပြည်တော်မှာရှိတဲ့ အဝတ်အထည်ဆိုင် ဆိုင်ခွဲ
            ၃ ခုကို Web-based System တစ်ခုတည်းနဲ့ ဗဟိုကနေ စနစ်တကျ
            ချိတ်ဆက်စီမံခန့်ခွဲပေးထားတဲ့ Distributed Database System တစ်ခု
            ဖြစ်ပါတယ်။
          </p>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
            Internet ပြတ်တောက်သွားရင်တောင် ဆိုင်ခွဲတွေက Local DB နဲ့
            ဆက်လက်အရောင်းအဝယ်ပြုလုပ်နိုင်မှာ ဖြစ်ပါတယ်။
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3">
                  <div className="rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 p-3 transition-all group-hover:scale-110 group-hover:shadow-md">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Key Features
          </h2>
          <p className="text-slate-500 text-center mb-8">
            Powerful features for modern retail management
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
                >
                  <div className={`rounded-xl ${feature.bg} p-3 w-fit transition-all group-hover:scale-110`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Active Shop Branches
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Our distributed network of retail locations
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold">
                <CheckCircle size={16} />
                All Active
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {branches.map((branch, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100/50 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-linear-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`rounded-xl bg-linear-to-r ${branch.color} p-2.5 text-white shadow-lg`}>
                    <Building2 size={18} />
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {branch.type}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-slate-900">
                  {branch.city}
                </h4>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{branch.location}</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                    <span>Active</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span>Online</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Built with Modern Technology
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Reliable, scalable, and future-proof
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                <Wifi size={16} className="text-blue-600" />
                <span>Real-time Sync</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                <Cloud size={16} className="text-violet-600" />
                <span>Cloud Ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-xl">
                <Server size={16} className="text-emerald-600" />
                <span>Offline Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-300 active:scale-95"
          >
            Get Started Now
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}