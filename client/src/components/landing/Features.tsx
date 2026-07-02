import { Box, RefreshCw, ShoppingCart, BarChart3, ShieldCheck, Store, ShoppingBag, Users } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <Box className="h-5 w-5 md:h-6 md:w-6 text-[#B27B32]" />,
      title: "ကုန်ပစ္စည်းစီမံခန့်ခွဲခြင်း",
      description: "ခက်ခဲရှုပ်ထွေးမှုမရှိဘဲ ကုန်ပစ္စည်းများကို လွယ်ကူစွာ စီမံနိုင်သည်။",
    },
    {
      icon: <RefreshCw className="h-5 w-5 md:h-6 md:w-6 text-[#B27B32]" />,
      title: "Branch များ စီမံခန့်ခွဲခြင်း",
      description: "ဆိုင်ခွဲများအားလုံးကို ဗဟိုစနစ်တစ်ခုတည်းမှ ချိတ်ဆက်စီမံနိုင်သည်။",
    },
    {
      icon: <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-[#B27B32]" />,
      title: "အော်ဒါစီမံခန့်ခွဲမှု",
      description: "အော်ဒါစာရင်းများကို တိကျမြန်ဆန်စွာ အရောင်းမှတ်တမ်း တင်နိုင်သည်။",
    },
    {
      icon: <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-[#B27B32]" />,
      title: "အရောင်းပြောင်းလဲမှု Report",
      description: "လုပ်ငန်းတိုးတက်မှုအတွက် အစီရင်ခံစာနှင့် Analytics များ ကြည့်ရှုနိုင်သည်။",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-[#B27B32]" />,
      title: "Data Synchronization",
      description: "ဆိုင်ခွဲများအကြား Data များကို စိတ်ချရစွာ ထပ်တူပြု ဆောင်ရွက်သည်။",
    },
  ];

  const stats = [
    { icon: <Store className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />, bg: "bg-emerald-50/80 border border-emerald-100", value: "3", label: "ချိတ်ဆက်ထားသော ဆိုင်ခွဲများ" },
    { icon: <Box className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />, bg: "bg-blue-50/80 border border-blue-100", value: "1000+", label: "စီမံထားသော ကုန်ပစ္စည်းများ" },
    { icon: <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />, bg: "bg-purple-50/80 border border-purple-100", value: "50K+", label: "ဆောင်ရွက်ပြီး အော်ဒါများ" },
    { icon: <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-600" />, bg: "bg-orange-50/80 border border-orange-100", value: "20+", label: "လက်ရှိ အသုံးပြုသူများ" },
  ];

  return (
    <section id="features" className="bg-[#FAF7F2] pt-8 pb-24 text-[#2C2115]">
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1A1105] relative inline-block pb-3 tracking-tight">
            သင့်အဝတ်အထည်လုပ်ငန်းအတွက် လိုအပ်မည့် အင်္ဂါရပ်များ
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#B27B32] rounded-full" />
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 items-stretch border-t border-b border-dashed border-[#D5C7B3]/60 py-10">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-5 bg-transparent border-r-0 border-b border-dashed border-[#E3D9C6]/60 last:border-0 lg:border-b-0 lg:border-r lg:last:border-r-0 transition-all duration-200 hover:scale-102"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3ECE0] shadow-sm border border-[#EBE2D3]">
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-[#1A1105]">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-[#EFE9DC] bg-white p-6 shadow-md grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0 items-center md:divide-x divide-[#EFE9DC]">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-4 justify-center px-4 ${
                idx % 2 === 0 ? "border-r border-[#EFE9DC]/60 md:border-r-0" : ""
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${stat.bg}`}>
                {stat.icon}
              </div>
              <div>
                <h4 className="text-xl md:text-2xl font-extrabold text-[#1A1105] tracking-tight">{stat.value}</h4>
                <p className="text-[11px] md:text-xs text-[#8C7E6B] font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}