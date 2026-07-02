export default function Login() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2C2115] flex flex-col justify-between">

      <main className="mx-auto max-w-7xl w-full px-6 pt-16 pb-12 grid lg:grid-cols-12 gap-12 items-start relative z-10">
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D5C7B3] bg-white px-4 py-1.5 text-sm font-medium text-[#B27B32] shadow-sm w-fit">
            <span>✨ Smart • Simple • Synchronized</span>
          </div>

          <h2 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl text-[#1A1105] leading-[1.2]">
            Distributed <br />
            <span className="text-[#B27B32]">Clothing Shop</span> <br />
            Management System
          </h2>

          <p className="mt-4 text-base text-[#615545] leading-relaxed max-w-xl">
            အဝတ်အထည်ဆိုင်များကို တစ်နေရာတည်းမှ စီမံခန့်ခွဲနိုင်ပြီး ကုန်ပစ္စည်းများ၊ အရောင်းအဝယ်များ၊ လက်ကျန်ပစ္စည်းများနှင့် အစီရင်ခံစာများကို လွယ်ကူစွာ စီမံနိုင်ပါသည်။
          </p>

          <div className="mt-8 space-y-5 max-w-lg">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-white border border-[#EFE9DC] rounded-xl text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[#1A1105] text-sm md:text-base">ကုန်ပစ္စည်းစီမံခန့်ခွဲခြင်း</h4>
                <p className="text-xs md:text-sm text-[#8C7E6B] mt-0.5">ကုန်ပစ္စည်းများကို လွယ်ကူစွာ စီမံနိုင်သည်။</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-white border border-[#EFE9DC] rounded-xl text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[#1A1105] text-sm md:text-base">Branch များကို စီမံခန့်ခွဲခြင်း</h4>
                <p className="text-xs md:text-sm text-[#8C7E6B] mt-0.5">Branch များကို ချိတ်ဆက်စီမံနိုင်သည်။</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-white border border-[#EFE9DC] rounded-xl text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[#1A1105] text-sm md:text-base">အရောင်းစာရင်းများ ကြည့်ရှုနိုင်ခြင်း</h4>
                <p className="text-xs md:text-sm text-[#8C7E6B] mt-0.5">အရောင်းစာရင်းနှင့် Report များကို ကြည့်ရှုနိုင်သည်။</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-white border border-[#EFE9DC] rounded-xl text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-[#1A1105] text-sm md:text-base">Data Synchronization</h4>
                <p className="text-xs md:text-sm text-[#8C7E6B] mt-0.5">Branch များအကြား Data Synchronization ဆောင်ရွက်သည်။</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden relative max-w-xl h-48 border border-white/40 shadow-inner bg-[#EFE9DC]">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800"
              alt="Shop Banner"
              className="w-full h-full object-cover opacity-85 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent" />
          </div>
        </div>

        <div className="lg:col-span-6 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/95 p-8 shadow-xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#EFE9DC] text-[#B27B32]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a1 1 0 0 0-1.24.76L14 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a1 1 0 0 0-.62-.91Z" /></svg>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#1A1105]">အကောင့်ဝင်ရန်</h3>
              <p className="text-xs text-[#8C7E6B] mt-1">သင့်အကောင့်ဖြင့် Login ဝင်ပါ။</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-[#615545] mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C7E6B]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </span>
                  <input
                    type="email"
                    placeholder="ဥပမာ - admin@gmail.com"
                    className="w-full pl-11 pr-4 py-3 border border-[#D5C7B3] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B27B32]/30 focus:border-[#B27B32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#615545] mb-2">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8C7E6B]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Password ထည့်ပါ"
                    className="w-full pl-11 pr-11 py-3 border border-[#D5C7B3] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B27B32]/30 focus:border-[#B27B32]"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8C7E6B] cursor-pointer hover:text-[#1A1105]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <label className="flex items-center gap-2 text-[#615545] cursor-pointer">
                  <input type="checkbox" className="rounded border-[#D5C7B3] text-[#B27B32] focus:ring-[#B27B32]" />
                  Remember Me
                </label>
                <a href="#forgot" className="text-[#B27B32] hover:underline">စကားဝှက်မေ့နေပါသလား?</a>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#B27B32] py-3.5 font-bold text-white shadow-md transition duration-300 hover:bg-[#966524] hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                အကောင့်ဝင်ရန်
              </button>
            </form>

            <div className="mt-5 p-4 rounded-xl bg-[#F6F0E5] border border-[#E9DEC9] text-xs text-[#615545] flex gap-3 leading-relaxed">
              <div className="text-[#B27B32] shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/xl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              </div>
              <p>
                အကောင့်အသစ်ဖွင့်၍ မရပါ။ အသုံးပြုမည့်အကောင့်ကို <span className="font-bold text-[#1A1105]">System Administrator</span> မှသာ ဖန်တီးပေးပါမည်။
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-[#8C7E6B]">
              <div className="h-[1px] bg-[#EFE9DC] w-full" />
              <span className="shrink-0 font-medium">သို့မဟုတ်</span>
              <div className="h-[1px] bg-[#EFE9DC] w-full" />
            </div>
          </div>
        </div>
      </main>

      <section className="w-full bg-[#FAF7F2] pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h3 className="text-xl md:text-2xl font-extrabold text-[#1A1105] relative inline-block pb-3">
              သင့်အတွက် လိုအပ်မည့် အင်္ဂါရပ်များ
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[#B27B32] rounded-full" />
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 items-stretch border-t border-b border-dashed border-[#D5C7B3]/60 py-10">
            <div className="flex flex-col items-center text-center px-4 border-r-0 border-b border-dashed border-[#E3D9C6] last:border-0 lg:border-b-0 lg:border-r lg:last:border-r-0 pb-6 lg:pb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF0DC] text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              </div>
              <h4 className="text-sm font-bold text-[#1A1105]">Inventory Control</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">လက်ကျန်ကုန်ပစ္စည်းများကို Real-time နှင့် အထွေထွေစုံစမ်းတိုင်ပင် စီမံနိုင်သည်</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 border-r-0 border-b border-dashed border-[#E3D9C6] last:border-0 lg:border-b-0 lg:border-r lg:last:border-r-0 pb-6 lg:pb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF0DC] text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
              </div>
              <h4 className="text-sm font-bold text-[#1A1105]">Branch Synchronization</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">Branch များနှင့် Central Server အကြား Data များကို ချောမွေ့စွာ Synchronize လုပ်နိုင်သည်</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 border-r-0 border-b border-dashed border-[#E3D9C6] last:border-0 lg:border-b-0 lg:border-r lg:last:border-r-0 pb-6 lg:pb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF0DC] text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              </div>
              <h4 className="text-sm font-bold text-[#1A1105]">Order Management</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">အော်ဒါများကို လွယ်ကူမြန်ဆန်စွာ စီမံနိုင်ပြီး တိကျသော အစီရင်ခံစာများရယူနိုင်သည်</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 border-r-0 border-b border-dashed border-[#E3D9C6] last:border-0 lg:border-b-0 lg:border-r lg:last:border-r-0 pb-6 lg:pb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF0DC] text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <h4 className="text-sm font-bold text-[#1A1105]">Reports & Analytics</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">Powerful Report များနှင့် Analytics များဖြင့် သင့်လုပ်ငန်းကို မိမိတိုးတက်အောင် စီမံနိုင်သည်</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pb-6 lg:pb-0">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF0DC] text-[#B27B32] shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
              <h4 className="text-sm font-bold text-[#1A1105]">Secure & Reliable</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#615545]">Enterprise-grade Security ဖြင့် သင့် Data များကို လုံခြုံစိတ်ချရစွာ ကာကွယ်ထားပါသည်</p>
            </div>
          </div>

          <div className="mt-12 mx-auto max-w-5xl rounded-2xl border border-[#EFE9DC] bg-white p-6 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 items-center divide-x-0 divide-y md:divide-y-0 md:divide-x divide-[#EFE9DC]">
            <div className="flex items-center gap-4 justify-center px-4 pt-2 md:pt-0">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-[#1A1105]">3</h4>
                <p className="text-[11px] text-[#8C7E6B] font-bold">Branches Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center px-4 pt-4 md:pt-0">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-[#1A1105]">1000+</h4>
                <p className="text-[11px] text-[#8C7E6B] font-bold">Products Managed</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center px-4 pt-4 md:pt-0">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-[#1A1105]">50K+</h4>
                <p className="text-[11px] text-[#8C7E6B] font-bold">Orders Processed</p>
              </div>
            </div>

            <div className="flex items-center gap-4 justify-center px-4 pt-4 md:pt-0">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-[#1A1105]">20+</h4>
                <p className="text-[11px] text-[#8C7E6B] font-bold">Active Users</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}