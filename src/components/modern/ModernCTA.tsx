import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, CheckCircle, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ModernCTA = () => {
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

    const element = document.getElementById('modern-cta');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const features = [
    'No setup fees or hidden costs',
    '45-day free trial',
    'Cancel anytime',
    '24/7 customer support',
  ];

  return (
    <section
      id="modern-cta"
      className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-2xl animate-bounce" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 mb-8">
            <Zap className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-300">Limited Time Offer</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}
              Your Business?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
            Join 100+ successful businesses already growing with Billbox. Start your free trial
            today and see results in 24 hours.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-white font-semibold text-xs">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ml-4 text-left">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-white font-semibold ml-2">4.9/5</span>
                </div>
                <div className="text-gray-400 text-sm">from 100+ reviews</div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="grid md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center md:justify-start">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-105 group shadow-2xl shadow-blue-500/25"
            >
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-12 py-6 text-xl font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Schedule Demo
            </Button>
          </div>

          {/* Urgency */}
          <div className="mt-8">
            <p className="text-gray-400 text-sm">
              🔥 <span className="text-orange-400 font-semibold">Special Launch Pricing:</span> Save
              50% on your first 3 months
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModernCTA;
