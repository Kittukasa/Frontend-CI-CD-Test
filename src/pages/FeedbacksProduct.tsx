import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Star,
  MessageCircle,
  TrendingUp,
  Award,
  Users,
  Zap,
  ArrowRight,
  Play,
  ThumbsUp,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

const FeedbacksProduct = () => {
  const features = [
    {
      icon: Star,
      title: 'Rating Collection',
      description: 'Collect 5-star ratings directly through e-bills and WhatsApp.',
      gradient: 'from-yellow-500 to-orange-600',
    },
    {
      icon: MessageCircle,
      title: 'Review Requests',
      description: 'Automatically request reviews after every purchase.',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      icon: Award,
      title: 'Google Integration',
      description: 'Push positive reviews to Google My Business instantly.',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      icon: TrendingUp,
      title: 'Sentiment Analysis',
      description: 'AI-powered analysis of customer feedback trends.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Users,
      title: 'Response Templates',
      description: 'Pre-built responses for common feedback scenarios.',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified immediately of negative feedback to respond fast.',
      gradient: 'from-orange-500 to-red-600',
    },
  ];

  const benefits = [
    {
      title: 'Boost Your Reputation',
      description: 'More 5-star reviews mean higher visibility and trust.',
    },
    {
      title: 'Improve Service Quality',
      description: 'Identify issues quickly and resolve them proactively.',
    },
    {
      title: 'Build Customer Rewards & Coupons',
      description: 'Show customers you care by responding to every review.',
    },
    {
      title: 'Increase Conversions',
      description: 'Positive reviews drive more sales and new customers.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-pulse"
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-6">
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-yellow-300">
                Customer Feedback & Reviews
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Collect Reviews.
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Build Your Reputation.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Collect real-time customer reviews and insights directly through e-bills or WhatsApp
              links. Turn happy customers into brand advocates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                Start Collecting
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
              <div className="flex flex-col items-center justify-center w-full">
                <img
                  src="/placeholders/feedback-collection.png"
                  alt="Feedback and reviews dashboard preview"
                  width={1280}
                  height={720}
                  className="w-full h-auto max-w-3xl rounded-xl border border-white/10 object-contain shadow-lg"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 border border-yellow-200 mb-6">
                <span className="text-sm font-semibold text-yellow-700">Feedback System</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Turn Customers Into
                <span className="block bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Brand Advocates
                </span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox Feedbacks makes it effortless to collect customer reviews at the perfect
                moment — right after purchase. Get genuine feedback, identify issues early, and
                showcase positive reviews to attract new customers.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every review is an opportunity to improve and grow. Respond quickly, resolve
                concerns, and build lasting relationships with your customers.
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
                  src="/placeholders/review-widget.png"
                  alt="Embedded review widget preview"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-w-3xl rounded-xl border border-yellow-200 object-contain shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-yellow-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Why Customer Reviews
              <span className="block bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Matter More Than Ever
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
                className="bg-white rounded-2xl p-6 border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
              <span className="block bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                For Review Management
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
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-yellow-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
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

      <section className="py-20 lg:py-32 bg-gradient-to-br from-amber-900 via-orange-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Start Collecting
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                5-Star Reviews Today
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Build trust, improve service, and grow your business with customer feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all"
              >
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

export default FeedbacksProduct;
