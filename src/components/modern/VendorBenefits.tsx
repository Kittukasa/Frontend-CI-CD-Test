import {
  TrendingUp,
  Users,
  Zap,
  Shield,
  Clock,
  Target,
  BarChart3,
  MessageSquare,
  Gift,
  Building2,
  BrainCircuit,
  FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const VendorBenefits = () => {
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

    const element = document.getElementById('vendor-benefits');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      icon: FileText,
      title: 'Smart E-Bill',
      description:
        'Instant digital bills that are always accessible and ready to share across channels.',
      color: 'from-blue-500 to-cyan-500',
      stat: 'WhatsApp-ready',
    },
    {
      icon: Building2,
      title: 'MultiStore Analytics',
      description:
        'Chain level visibility with store comparisons, trends and drill downs in one dashboard.',
      color: 'from-cyan-500 to-blue-500',
      stat: 'Real time across stores',
    },
    {
      icon: Zap,
      title: 'Instant Automation',
      description: 'Automated WhatsApp campaigns, follow-ups, and customer engagement',
      color: 'from-purple-500 to-pink-500',
      stat: '10x faster campaigns',
    },
    {
      icon: Users,
      title: 'Customer Intelligence',
      description: 'Deep insights into customer behavior, preferences, and purchase patterns',
      color: 'from-blue-500 to-cyan-500',
      stat: '95% data accuracy',
    },
    {
      icon: TrendingUp,
      title: '35% Revenue Growth',
      description: 'Increase repeat customers and average order value through targeted campaigns',
      color: 'from-green-500 to-emerald-500',
      stat: 'ƒ,12.5L+ avg increase',
    },
    {
      icon: Clock,
      title: 'Save 15+ Hours/Week',
      description: 'Eliminate manual processes with automated billing and customer management',
      color: 'from-indigo-500 to-purple-500',
      stat: '80% time savings',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-grade security with GDPR compliance and data protection',
      color: 'from-orange-500 to-red-500',
      stat: '99.9% uptime',
    },
    {
      icon: Gift,
      title: 'Rewards & Coupons System',
      description:
        'Digital rewards that turn repeat visits into long-term engagement with rewards & coupons. Simple tiers, instant redemption.',
      color: 'from-violet-500 to-fuchsia-500',
      stat: '+25% repeat orders',
    },
    {
      icon: BrainCircuit,
      title: 'Customer Data Platform+',
      description:
        'Advanced CDP with segments, journeys and Best Path across WhatsApp, SMS, Email and App.',
      color: 'from-purple-500 to-pink-500',
      stat: '+40% open rates',
    },
  ];

  return (
    <section id="vendor-benefits" className="py-20 bg-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
            <BarChart3 className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-300">Proven Results</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Why Vendors Choose
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}
              Billbox
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join 100+ businesses already growing with Billbox. See the measurable impact on your
            revenue and customer relationships.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className={`group bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                  {benefit.title}
                </h3>

                <p className="text-gray-400 mb-4 leading-relaxed">{benefit.description}</p>

                {/* Stat */}
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${benefit.color} bg-opacity-10 border border-current border-opacity-20`}
                >
                  <span
                    className={`text-sm font-semibold bg-gradient-to-r ${benefit.color} bg-clip-text text-transparent`}
                  >
                    {benefit.stat}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success Stories Section */}
        <div
          className={`relative bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-3xl p-8 lg:p-12 border border-slate-600/30 transition-all duration-1000 delay-500 overflow-hidden ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Background Lifestyle Image */}
          <div className="absolute inset-0 opacity-20">
            <img
              src="/images/lifestyle-store-owner-1.svg"
              alt="Store owner success story"
              className="w-full h-full object-cover rounded-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 rounded-3xl" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6 backdrop-blur-sm">
                <MessageSquare className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-sm font-medium text-green-300">Success Story</span>
              </div>

              <blockquote className="text-2xl lg:text-3xl font-medium text-white mb-6 leading-relaxed">
                "Billbox transformed our customer engagement. We saw a
                <span className="text-green-400"> 45% increase in repeat customers</span>
                within just 3 months."
              </blockquote>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">RS</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Rajesh Sharma</div>
                  <div className="text-gray-400">Owner, Wellcare Medico</div>
                </div>
              </div>
            </div>

            {/* Right Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white mb-2">32L+</div>
                <div className="text-gray-300">Additional Revenue</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white mb-2">2,800+</div>
                <div className="text-gray-300">Happy Customers</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white mb-2">85%</div>
                <div className="text-gray-300">Customer Retention</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl border border-orange-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white mb-2">3 Months</div>
                <div className="text-gray-300">ROI Timeline</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VendorBenefits;
