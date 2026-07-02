import React from 'react';

export default function About() {
  const branches = [
    { city: 'Yangon', location: 'Downtown Hub', type: 'Main Branch' },
    { city: 'Mandalay', location: '78th Street Showroom', type: 'Sub Branch' },
    { city: 'Naypyitaw', location: 'Thiri Yadanar Mall', type: 'Sub Branch' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#FDFBF7] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <span className="text-xs uppercase tracking-widest font-bold text-[#E2675A]">About the System</span>
        <h1 className="text-4xl md:text-5xl font-black text-[#111111] mt-3 mb-8 leading-tight">
          Distributed Clothing Shop System
        </h1>
        
        <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-12">
          ဒီစနစ်ဟာ ရန်ကုန်၊ မန္တလေး၊ နေပြည်တော်မှာရှိတဲ့ အဝတ်အထည်ဆိုင် ဆိုင်ခွဲ ၃ ခုကို Web-based System တစ်ခုတည်းနဲ့ ဗဟိုကနေ စနစ်တကျ ချိတ်ဆက်စီမံခန့်ခွဲပေးထားတဲ့ Distributed Database System တစ်ခု ဖြစ်ပါတယ်။ Internet ပြတ်တောက်သွားရင်တောင် ဆိုင်ခွဲတွေက Local DB နဲ့ ဆက်လက်အရောင်းအဝယ်ပြုလုပ်နိုင်မှာ ဖြစ်ပါတယ်။
        </p>

        {/* Branch Grid */}
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Active Shop Branches</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {branches.map((b, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-[#E2675A] block mb-1">{b.type}</span>
              <h4 className="text-xl font-extrabold text-[#111111]">{b.city}</h4>
              <p className="text-gray-400 text-xs mt-2">{b.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}