import { Link } from "react-router-dom";

export function Hero() {
  const collections = [
    {
      title: "Shop Store",
      images: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1567401893424-76b604a4922d?auto=format&fit=crop&q=80&w=400"
      ]
    },
    {
      title: "Sweaters",
      images: [
        "https://images.unsplash.com/photo-1542062700-9b61ccbc1696?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400"
      ]
    },
    {
      title: "T-Shirts",
      images: [
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400"
      ]
    },
    {
      title: "Jeans",
      images: [
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&q=80&w=400"
      ]
    },
    {
      title: "Shoes",
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=80&w=400"
      ]
    }
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] text-[#2C2115]">
      <style>{`
        @keyframes innerFade {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes innerFadeAlt {
          0%, 45% { opacity: 0; }
          50%, 95% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-fade-1 { animation: innerFade 8s infinite ease-in-out; }
        .animate-fade-2 { animation: innerFadeAlt 8s infinite ease-in-out; }
      `}</style>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#EFE9DC]/40 rounded-full blur-3xl -z-10" />
      <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-[#E3D9C6]/30 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl w-full px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D5C7B3] bg-white px-4 py-1.5 text-sm font-medium text-[#B27B32] shadow-sm select-none">
          <span>✨ Smart • Simple • Synchronized</span>
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-[#1A1105] max-w-5xl mx-auto leading-[1.2]">
          Distributed <br className="sm:hidden" />
          <span className="text-[#B27B32]">Clothing Shop</span> <br />
          Management System
        </h1>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#615545] max-w-3xl mx-auto leading-relaxed font-medium">
          ကုန်ပစ္စည်းများ၊ အော်ဒါများနှင့် Branch Operations များကို တစ်နေရာတည်းမှ အဆင်ပြေချောမွေ့စွာ စီမံခန့်ခွဲလိုက်ပါ။
        </p>
        <p className="mt-2 text-sm sm:text-base text-[#8C7E6B] max-w-2xl mx-auto">
          Real-time synchronization၊ စမတ်ကျသော ကုန်ပစ္စည်းလက်ကျန် စီမံခန့်ခွဲမှုနှင့် တိကျသေချာသော လုပ်ငန်းသုံးအစီရင်ခံစာများ — အားလုံးကို ဗဟိုပြုစနစ်တစ်ခုတည်းတွင် ရရှိနိုင်ပါပြီ။
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            to="/login"
            className="group flex items-center gap-2 rounded-xl bg-[#B27B32] px-8 py-4 font-bold text-white shadow-md transition duration-300 hover:bg-[#966524] hover:shadow-lg active:scale-95"
          >
            အသုံးပြုရန် စတင်မည်
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-bold text-[#8C7E6B]">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            လုံခြုံစိတ်ချရခြင်း
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ယုံကြည်စိတ်ချရခြင်း
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            အမြဲတမ်းအဆင်သင့်ရှိခြင်း
          </span>
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 sm:gap-4 overflow-visible px-4 py-12 [perspective:1200px]">
          
          <div className="w-20 sm:w-32 md:w-40 lg:w-44 aspect-[3/4] rounded-2xl bg-[#E6DEC9] overflow-hidden shadow-lg transition-all duration-500 origin-center shrink-0"
               style={{ transform: "rotateY(25deg) scale(0.9) translateZ(-40px) translateX(10px)" }}>
            <div className="relative w-full h-full">
              <img src={collections[0].images[0]} alt={collections[0].title} className="absolute inset-0 w-full h-full object-cover animate-fade-1" />
              <img src={collections[0].images[1]} alt={collections[0].title} className="absolute inset-0 w-full h-full object-cover animate-fade-2" />
            </div>
          </div>

          <div className="w-22 sm:w-34 md:w-44 lg:w-48 aspect-[3/4] rounded-2xl bg-[#D6CBB3] overflow-hidden shadow-xl transition-all duration-500 origin-center shrink-0"
               style={{ transform: "rotateY(15deg) scale(0.95) translateZ(-15px)" }}>
            <div className="relative w-full h-full">
              <img src={collections[1].images[0]} alt={collections[1].title} className="absolute inset-0 w-full h-full object-cover animate-fade-1" />
              <img src={collections[1].images[1]} alt={collections[1].title} className="absolute inset-0 w-full h-full object-cover animate-fade-2" />
            </div>
          </div>

          <div className="w-26 sm:w-38 md:w-48 lg:w-52 aspect-[3/4] rounded-2xl bg-[#C7BA9E] overflow-hidden shadow-2xl z-20 scale-105 transition-all duration-500 shrink-0 border-2 border-white/40"
               style={{ transform: "translateZ(30px)" }}>
            <div className="relative w-full h-full">
              <img src={collections[2].images[0]} alt={collections[2].title} className="absolute inset-0 w-full h-full object-cover animate-fade-1" />
              <img src={collections[2].images[1]} alt={collections[2].title} className="absolute inset-0 w-full h-full object-cover animate-fade-2" />
            </div>
          </div>

          <div className="w-22 sm:w-34 md:w-44 lg:w-48 aspect-[3/4] rounded-2xl bg-[#D6CBB3] overflow-hidden shadow-xl transition-all duration-500 origin-center shrink-0"
               style={{ transform: "rotateY(-15deg) scale(0.95) translateZ(-15px)" }}>
            <div className="relative w-full h-full">
              <img src={collections[3].images[0]} alt={collections[3].title} className="absolute inset-0 w-full h-full object-cover animate-fade-1" />
              <img src={collections[3].images[1]} alt={collections[3].title} className="absolute inset-0 w-full h-full object-cover animate-fade-2" />
            </div>
          </div>

          <div className="w-20 sm:w-32 md:w-40 lg:w-44 aspect-[3/4] rounded-2xl bg-[#E6DEC9] overflow-hidden shadow-lg transition-all duration-500 origin-center shrink-0"
               style={{ transform: "rotateY(-25deg) scale(0.9) translateZ(-40px) translateX(-10px)" }}>
            <div className="relative w-full h-full">
              <img src={collections[4].images[0]} alt={collections[4].title} className="absolute inset-0 w-full h-full object-cover animate-fade-1" />
              <img src={collections[4].images[1]} alt={collections[4].title} className="absolute inset-0 w-full h-full object-cover animate-fade-2" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}