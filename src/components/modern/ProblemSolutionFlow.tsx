import { ArrowRight, FileText, Smartphone, BarChart3, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const ProblemSolutionFlow = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('problem-solution');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem-solution"
      className="py-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0B1020 0%, #0E1328 70%, #0B1020 100%)' }}
    >
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            The Paper Bill
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> Problem</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Every paper bill is a missed opportunity. Here's how Billbox transforms your business.
          </p>
        </div>

        {/* Before vs After with central visual placeholder */}
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Before cards */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 font-semibold text-sm">Before: The Old Way</span>
              </div>
              <div className="h-px flex-1 bg-red-500/10" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 border border-red-500/15 bg-[#1a1f2f]/70 backdrop-blur-sm">
                <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Paper Bills</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Customers lose receipts, no digital record, zero engagement after purchase</p>
              </div>
              <div className="rounded-2xl p-6 border border-red-500/15 bg-[#1a1f2f]/70 backdrop-blur-sm">
                <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">No Insights</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Zero customer data, no analytics, impossible to track repeat customers</p>
              </div>
              <div className="rounded-2xl p-6 border border-red-500/15 bg-[#1a1f2f]/70 backdrop-blur-sm">
                <div className="w-12 h-12 bg-red-500/15 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Lost Customers</h3>
                <p className="text-gray-400 text-sm leading-relaxed">No way to re-engage, send offers, or build lasting relationships</p>
              </div>
            </div>
          </div>

          {/* Visual placeholder */}
          <div className={`transition-all duration-1000 lg:delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative max-w-6xl mx-auto w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_25px_80px_-35px_rgba(0,0,0,0.8)] bg-black/10">
              <div className="absolute inset-0 -z-10 blur-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-indigo-500/10" />
              <img
                src="/images/ebill-story-placeholder.png"
                alt="Paper to Smart E-Bill visual"
                className="w-full h-auto object-contain block"
              />
            </div>
          </div>

          {/* After cards */}
          <div className={`transition-all duration-1000 lg:delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                <Zap className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-green-400 font-semibold text-sm">After: The BillBox Way</span>
              </div>
              <div className="h-px flex-1 bg-green-500/10" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 border border-blue-500/25 bg-gradient-to-br from-[#0e1a30] to-[#0c1530]">
                <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Digital E-Bills</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Instant WhatsApp delivery, permanent digital records, enhanced customer experience</p>
                <div className="mt-3 text-xs text-blue-300 font-medium">+95% Customer Satisfaction</div>
              </div>
              <div className="rounded-2xl p-6 border border-purple-500/25 bg-gradient-to-br from-[#1c1230] to-[#1a0f2b]">
                <div className="w-12 h-12 bg-purple-500/15 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Real-Time Analytics</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Customer insights, purchase patterns, revenue tracking, growth metrics</p>
                <div className="mt-3 text-xs text-purple-300 font-medium">+300% Data Visibility</div>
              </div>
              <div className="rounded-2xl p-6 border border-green-500/25 bg-gradient-to-br from-[#0e1f1a] to-[#0c1b17]">
                <div className="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-300" />
                </div>
                <h3 className="text-white font-semibold mb-2">Smart Campaigns</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Automated WhatsApp marketing, personalized offers, customer retention</p>
                <div className="mt-3 text-xs text-green-300 font-medium">+45% Repeat Customers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-xl text-white font-semibold mb-3">
            Ready to transform your business?
          </p>
          <div className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 cursor-pointer group shadow-[0_10px_25px_-18px_rgba(0,0,0,0.7)]">
            See Billbox in Action
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionFlow;
