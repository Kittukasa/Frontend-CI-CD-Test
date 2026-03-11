import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Building2,
  BarChart3,
  MapPin,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Play,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const MultiStoreProduct = () => {
  const features = [
    {
      icon: Building2,
      title: 'Unified Dashboard',
      description: 'View performance of all locations from one central command center.',
      gradient: 'from-indigo-500 to-blue-600',
    },
    {
      icon: BarChart3,
      title: 'Location Comparison',
      description: 'Compare revenue, customers, and growth across every branch.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: MapPin,
      title: 'Regional Insights',
      description: 'Understand location-specific trends and customer preferences.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Users,
      title: 'Team Performance',
      description: 'Track staff performance and productivity by location.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Globe,
      title: 'Chain-Wide Campaigns',
      description: 'Launch promotions across all stores or target specific regions.',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Centralized Control',
      description: 'Manage access, settings, and compliance from headquarters.',
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  const benefits = [
    {
      title: 'Identify Top Performers',
      description: 'See which locations drive the most revenue and replicate success.',
    },
    {
      title: 'Spot Underperforming Stores',
      description: 'Quickly identify struggling locations and take corrective action.',
    },
    {
      title: 'Optimize Inventory',
      description: 'Allocate stock based on location-specific demand patterns.',
    },
    {
      title: 'Standardize Operations',
      description: 'Roll out best practices across all stores seamlessly.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
              <Building2 className="w-4 h-4 text-indigo-400 mr-2" />
              <span className="text-sm font-medium text-indigo-300">
                Multi-Location Intelligence
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Manage All Locations.
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                From One Dashboard.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Compare performance across all branches, identify top performers, and scale winning
              strategies — all from a unified control center.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
              >
                <Play className="mr-2 w-5 h-5" />
                See Demo
              </Button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-16"
            >
              <div className="relative max-w-5xl mx-auto">
                <div className="relative w-full h-auto rounded-xl overflow-hidden shadow-2xl">
                  <img
                    src="/images/multi-store-dashboard.png"
                    alt="Multi-Store Dashboard showing performance metrics across locations"
                    className="w-full h-full object-cover"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20400%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22400%22%20fill%3D"%232f3e46%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22285%22%20y%3D%22220%22%20font-family%3D"sans-serif"%20font-size%3D%2220%22%20fill%3D"%23ffffff"%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
                      target.alt = 'Multi-Store Dashboard placeholder';
                      target.className = 'w-full h-full object-cover bg-gray-800';
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What Is It */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
                <span className="text-sm font-semibold text-indigo-700">
                  Multi-Store Management
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                One Dashboard.
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Infinite Locations.
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox Multi-Store Management gives franchises and chain brands complete visibility
                into every location's performance. Compare sales, customers, and campaigns across
                all branches instantly.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you run 2 stores or 200, get real-time insights into what's working, what's
                not, and where to focus next — without switching dashboards or logging into multiple
                systems.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200 shadow-xl">
                <div className="relative w-full h-96 rounded-xl overflow-hidden">
                  <img
                    src="/images/location-map.png"
                    alt="Interactive map showing multiple store locations"
                    className="w-full h-full object-cover"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22500%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20500%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D"%23f5f3ff%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22285%22%20y%3D%22250%22%20font-family%3D"sans-serif"%20font-size%3D%2220%22%20fill%3D"%234f46e5%22%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
                      target.alt = 'Location map placeholder';
                      target.className = 'w-full h-full object-cover bg-indigo-50';
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Scale Smarter
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Not Harder
              </span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Everything You Need
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                To Manage Multiple Locations
              </span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feat.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feat.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Unify Your
              <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Multi-Store Operations
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Start managing all your locations from one powerful dashboard today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all"
              >
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MultiStoreProduct;
