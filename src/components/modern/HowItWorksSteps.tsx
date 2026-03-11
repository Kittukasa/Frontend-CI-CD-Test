import { Smartphone, BarChart3, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const HowItWorksSteps = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('how-it-works');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep(prev => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const steps = [
    {
      icon: Smartphone,
      title: 'Digital Bill Generation',
      description: 'Replace paper bills with beautiful digital e-bills sent instantly via WhatsApp',
      details:
        'Customers receive professional digital bills with your branding, payment links, and store information',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: BarChart3,
      title: 'Customer Intelligence',
      description: 'Automatically capture customer data and generate actionable business insights',
      details: 'Track purchase patterns, customer preferences, and revenue trends in real-time',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: Zap,
      title: 'Smart Campaigns',
      description:
        'Launch targeted WhatsApp campaigns to drive repeat purchases with rewards & coupons',
      details: 'Send personalized offers, reminders, and updates based on customer behavior',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 bg-gradient-to-b from-slate-900 to-black relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
            <CheckCircle className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-300">Simple Process</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            How Billbox
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}
              Works
            </span>
          </h2>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your business in three simple steps. No technical expertise required.
          </p>
        </div>

        {/* Steps Container */}
        <div className="max-w-6xl mx-auto">
          {/* Desktop View */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-green-500/30 transform -translate-y-1/2 z-0" />

              {/* Steps */}
              <div className="grid grid-cols-3 gap-8 relative z-10">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = activeStep === index;

                  return (
                    <div
                      key={index}
                      className={`text-center transition-all duration-1000 ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                      }`}
                      style={{ transitionDelay: `${index * 200}ms` }}
                    >
                      {/* Step Number & Icon */}
                      <div className="relative mb-8">
                        <div
                          className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${
                            step.bgColor
                          } border-2 ${
                            step.borderColor
                          } flex items-center justify-center transition-all duration-500 ${
                            isActive ? 'scale-110 shadow-2xl' : 'scale-100'
                          }`}
                        >
                          <Icon className="w-10 h-10 text-white/90 drop-shadow" />
                        </div>

                        {/* Step Number */}
                        <div
                          className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div
                        className={`bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10 transition-all duration-500 ${
                          isActive ? 'border-white/20 bg-white/10' : ''
                        }`}
                      >
                        <h3
                          className={`text-2xl font-bold mb-4 transition-all duration-300 ${
                            isActive
                              ? 'text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text'
                              : 'text-white'
                          }`}
                        >
                          {step.title}
                        </h3>

                        <p className="text-gray-300 mb-4 leading-relaxed">{step.description}</p>

                        <p className="text-sm text-gray-400 leading-relaxed">{step.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={index}
                  className={`transition-all duration-1000 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center mr-4`}
                      >
                        <Icon className="w-8 h-8 text-white/90 drop-shadow" />
                      </div>
                      <div>
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-sm mb-2`}
                        >
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-300 mb-4 leading-relaxed">{step.description}</p>

                    <p className="text-sm text-gray-400 leading-relaxed">{step.details}</p>
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-4">
                      <ArrowRight className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className={`text-center mt-16 transition-all duration-1000 delay-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="relative bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/30 max-w-2xl mx-auto overflow-hidden">
            {/* Background Lifestyle Image */}
            <div className="absolute inset-0 opacity-15">
              <img
                src="/images/lifestyle-store-owner-2.svg"
                alt="Store owner using Billbox"
                className="w-full h-full object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-2xl" />
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to get started?</h3>
              <p className="text-gray-300 mb-6">
                Join 100+ businesses already growing with Billbox
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSteps;
