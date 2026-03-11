import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Play,
  Eye,
  Brain,
  Filter,
  PieChart,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

const CustomerAnalyticsProduct = () => {
  const features = [
    {
      icon: Users,
      title: 'Customer Segmentation',
      description: 'Automatically segment customers by behavior, spend, and visit frequency.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: TrendingUp,
      title: 'Revenue Tracking',
      description: 'Monitor sales trends, peak hours, and revenue patterns in real-time.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: Clock,
      title: 'Visit Frequency Analysis',
      description: 'Track new vs. returning customers and identify loyal shoppers.',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: Target,
      title: 'Customer Lifetime Value',
      description: 'Calculate CLV and identify your most valuable customers.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Brain,
      title: 'Predictive Insights',
      description: 'AI-powered predictions on churn risk and buying patterns.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Filter,
      title: 'Advanced Filters',
      description: 'Filter by date, location, category, and custom parameters.',
      gradient: 'from-cyan-500 to-blue-600',
    },
  ];

  const insights = [
    {
      title: 'Who are my top customers?',
      description: 'Identify high-value customers and reward them strategically.',
    },
    {
      title: 'When do customers visit most?',
      description: 'Optimize staffing and inventory based on peak hours.',
    },
    {
      title: 'Which products drive repeat visits?',
      description: 'Focus on bestsellers and optimize your product mix.',
    },
    {
      title: 'Why are customers leaving?',
      description: 'Detect churn signals and re-engage at-risk customers.',
    },
  ];

  const metrics = [
    { stat: '100+', label: 'Data Points Tracked', icon: BarChart3 },
    { stat: '95%', label: 'Accuracy Rate', icon: Target },
    { stat: '<1min', label: 'Real-Time Updates', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6">
              <BarChart3 className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-300">
                Customer Intelligence Platform
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Know Your Customers.
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Grow Your Business.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Track customer behavior, spending patterns, and visit frequency — all in one unified
              dashboard. Make data-driven decisions that increase revenue and retention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl"
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
                Watch Demo
              </Button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-16 max-w-5xl mx-auto"
            >
              <div className="relative w-full h-auto aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/analytics-dashboard.png"
                  alt="Customer Analytics Dashboard showing key metrics and visualizations"
                  className="w-full h-full object-cover"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22450%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20450%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22450%22%20fill%3D%22%231a1a2e%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22285%22%20y%3D%22220%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20fill%3D%22%23ffffff%22%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
                    target.alt = 'Analytics Dashboard placeholder';
                    target.className = 'w-full h-full object-cover bg-gray-800';
                  }}
                />
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
                <span className="text-sm font-semibold text-blue-700">Customer Analytics</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Turn Data Into
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Actionable Insights
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox Customer Analytics transforms raw transaction data into meaningful insights.
                Understand who your customers are, what they buy, when they visit, and why they
                return.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every purchase, visit, and interaction is automatically tracked and analyzed —
                giving you a complete 360° view of your customer base without manual effort.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative w-full h-auto aspect-[16/9] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="/images/customer-dashboard.png"
                  alt="Customer data visualization dashboard with metrics and charts"
                  className="w-full h-full object-contain"
                  onError={e => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23f0f9ff%22%3E%3C%2Frect%3E%3Ctext%20x%3D%22285%22%20y%3D%22250%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20fill%3D%22%233b82f6%22%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
                    target.alt = 'Customer Dashboard placeholder';
                    target.className = 'w-full h-full object-contain bg-blue-50';
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Questions Answered */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Answer Critical
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Business Questions
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant answers to the questions that drive growth.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {insights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-white" />
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

      {/* Features Grid */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Powerful Features
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Built for Growth
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
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
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

      {/* Stats */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {metrics.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all"
                >
                  <Icon className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {item.stat}
                  </div>
                  <div className="text-gray-300 font-medium">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Start Making
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Data-Driven Decisions
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join hundreds of businesses using Billbox Customer Analytics to grow smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all"
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

export default CustomerAnalyticsProduct;
