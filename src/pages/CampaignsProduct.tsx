import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Megaphone, MessageSquare, Mail, Smartphone, Target, Zap, ArrowRight, Play, Users, BarChart3, Calendar, Send } from 'lucide-react';

const CampaignsProduct = () => {
  const channels = [
    { icon: MessageSquare, title: 'WhatsApp Campaigns', description: 'Send rich media messages with images, offers, and links directly.', gradient: 'from-green-500 to-emerald-600' },
    { icon: Smartphone, title: 'SMS Marketing', description: 'Reach customers instantly with text message promotions.', gradient: 'from-blue-500 to-cyan-600' },
    { icon: Mail, title: 'Email Campaigns', description: 'Create beautiful email campaigns with templates and tracking.', gradient: 'from-violet-500 to-purple-600' }
  ];

  const features = [
    { icon: Target, title: 'Smart Segmentation', description: 'Target customers by behavior, location, spend, and visit frequency.', gradient: 'from-pink-500 to-rose-600' },
    { icon: Calendar, title: 'Schedule Campaigns', description: 'Set up campaigns in advance and let them run automatically.', gradient: 'from-orange-500 to-red-600' },
    { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track opens, clicks, and conversions for every campaign.', gradient: 'from-cyan-500 to-blue-600' },
    { icon: Zap, title: 'Automation Rules', description: 'Trigger campaigns based on customer actions and milestones.', gradient: 'from-indigo-500 to-purple-600' },
    { icon: Users, title: 'Audience Builder', description: 'Create custom audiences with advanced filters and conditions.', gradient: 'from-green-500 to-teal-600' },
    { icon: Send, title: 'One-Click Send', description: 'Launch campaigns to hundreds of customers with a single click.', gradient: 'from-blue-500 to-violet-600' }
  ];

  const useCases = [
    { title: 'Festive Offers', description: 'Launch Diwali, New Year, or seasonal promotions across all channels.' },
    { title: 'Win-Back Campaigns', description: 'Re-engage customers who haven\'t visited in 30+ days.' },
    { title: 'Birthday Rewards', description: 'Automatically send personalized birthday offers.' },
    { title: 'Flash Sales', description: 'Create urgency with limited-time deals sent instantly.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-900 via-rose-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 mb-6">
              <Megaphone className="w-4 h-4 text-pink-400 mr-2" />
              <span className="text-sm font-medium text-pink-300">Multi-Channel Marketing</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Launch Campaigns.
              <span className="block bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">Drive More Sales.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Create and send targeted promotions across WhatsApp, SMS, and Email effortlessly. Reach hundreds of customers in minutes with personalized campaigns that convert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl">
                Start Free Trial<ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm">
                <Play className="mr-2 w-5 h-5" />See Examples
              </Button>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} className="mt-16">
                <div className="flex flex-col items-center justify-center w-full">
                  <img
                    src="/placeholders/campaign-dashboard.png"
                    alt="Campaign dashboard overview"
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
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-pink-100 border border-pink-200 mb-6">
                <span className="text-sm font-semibold text-pink-700">Campaign Manager</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Multi-Channel Marketing<span className="block bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Made Simple</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox Campaigns lets you create and launch promotions across WhatsApp, SMS, and Email from one unified platform. No technical skills required — just select your audience, craft your message, and send.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you're running a flash sale, announcing a new product, or re-engaging dormant customers, Billbox makes it effortless to reach your audience at scale.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/placeholders/campaign-builder.png"
                    alt="Campaign builder interface"
                    width={1200}
                    height={800}
                    className="w-full h-auto max-w-3xl rounded-xl border border-pink-200 object-contain shadow-lg"
                  />
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Reach Customers<span className="block bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">On Every Channel</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {channels.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-8 border-2 border-pink-200 hover:border-pink-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${ch.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{ch.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{ch.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Powerful Features<span className="block bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">For Every Campaign</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-pink-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feat.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
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

      {/* Use Cases */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-rose-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Campaign Ideas<span className="block bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">That Drive Results</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border-2 border-pink-200 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{uc.title}</h3>
                <p className="text-gray-600">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-pink-900 via-rose-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Launch Your First<span className="block bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Campaign Today</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Start engaging customers with powerful, targeted campaigns that drive sales.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all">
                Start Free Trial<ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all">
                See Examples
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CampaignsProduct;
