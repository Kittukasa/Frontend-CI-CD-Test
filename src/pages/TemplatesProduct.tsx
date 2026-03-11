import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Zap,
  CheckCircle2,
  ArrowRight,
  Play,
  FileText,
  Clock,
  Shield,
  Sparkles,
  Layout,
  Copy,
} from 'lucide-react';

const TemplatesProduct = () => {
  const categories = [
    {
      icon: Sparkles,
      title: 'Festive Offers',
      count: '150+',
      description: 'Diwali, New Year, Christmas, and seasonal campaigns.',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: Clock,
      title: 'Flash Sales',
      count: '80+',
      description: 'Limited-time deals and urgency-driven promotions.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: CheckCircle2,
      title: 'Customer Retention',
      count: '120+',
      description: 'Win-back, rewards & coupons, and re-engagement messages.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: MessageSquare,
      title: 'Transactional',
      count: '200+',
      description: 'Order confirmations, delivery updates, and receipts.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: Shield,
      title: 'Compliance-Ready',
      count: '100%',
      description: 'All templates are WhatsApp-approved and regulation-compliant.',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      icon: Layout,
      title: 'Custom Branding',
      count: 'Unlimited',
      description: 'Add your logo, colors, and brand voice to any template.',
      gradient: 'from-cyan-500 to-blue-600',
    },
  ];

  const benefits = [
    {
      title: 'No Design Skills Needed',
      description: 'Professional templates ready to use in seconds.',
    },
    {
      title: 'WhatsApp-Approved',
      description: 'All templates meet WhatsApp Business API guidelines.',
    },
    {
      title: 'Industry-Specific',
      description: 'Templates tailored for retail, restaurants, salons, and more.',
    },
    {
      title: 'Instant Launch',
      description: 'Copy, customize, and send campaigns in under 5 minutes.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6">
              <MessageSquare className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-medium text-emerald-300">
                Pre-Built Message Templates
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              1000+ Ready Templates.
              <span className="block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Launch Campaigns Instantly.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Access 1000+ pre-approved WhatsApp, SMS, and Email templates for offers, promotions,
              and reminders. No design needed — just customize and send.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                Browse Templates
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm"
              >
                <Play className="mr-2 w-5 h-5" />
                See Examples
              </Button>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-16"
            >
              <div className="flex flex-col items-center justify-center w-full">
                <img
                  src="/placeholders/message-templates.png"
                  alt="Template gallery preview"
                  width={1280}
                  height={720}
                  className="w-full h-auto max-w-3xl rounded-xl border border-white/10 object-contain shadow-lg"
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
                <span className="text-sm font-semibold text-emerald-700">Message Templates</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Ready-Made Messages
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  For Every Occasion
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox provides 1000+ professionally crafted message templates that are
                pre-approved for WhatsApp Business API. No more waiting days for approval — launch
                campaigns immediately.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every template is designed by marketing experts, tested for engagement, and
                optimized for conversions. Simply pick a template, add your brand details, and send
                to hundreds of customers instantly.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/placeholders/template-library.png"
                  alt="Template library interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-w-3xl rounded-xl border border-emerald-200 object-contain shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Templates for
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Every Campaign Type
              </span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-emerald-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${cat.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 mb-2">{cat.count}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{cat.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{cat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Why Use
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Pre-Built Templates?
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
                className="bg-white rounded-2xl p-6 border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Launch in
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Browse & Select',
                desc: 'Choose from 1000+ categorized templates.',
              },
              {
                step: '02',
                title: 'Customize',
                desc: 'Add your brand name, offer details, and logo.',
              },
              {
                step: '03',
                title: 'Send Instantly',
                desc: 'Launch to your audience with one click.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-white rounded-2xl p-8 border-2 border-emerald-200 shadow-lg"
              >
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Start Using
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Ready Templates Today
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Browse 1000+ templates and launch your first campaign in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                Browse Templates
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all"
              >
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TemplatesProduct;
