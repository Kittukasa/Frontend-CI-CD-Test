import { motion } from 'framer-motion';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { FileText, Smartphone, TrendingUp, Leaf, Shield, Zap, CheckCircle2, XCircle, ArrowRight, Play, BarChart3, Users, TreePine, Sparkles, Quote } from 'lucide-react';

const EBillProduct = () => {
  const advantages = [
    { icon: Zap, title: 'Instant Delivery', description: 'Send receipts directly to WhatsApp or SMS within seconds.', gradient: 'from-cyan-500 to-blue-600' },
    { icon: Sparkles, title: 'Smart Branding', description: 'Add your logo, website, offers, and promo banners on Smart E-Bills.', gradient: 'from-violet-500 to-purple-600' },
    { icon: BarChart3, title: 'Data-Driven', description: 'Capture customer name, phone, spend, and engagement automatically.', gradient: 'from-blue-500 to-cyan-500' },
    { icon: Leaf, title: 'Eco-Friendly', description: 'Reduce waste and go paperless effortlessly.', gradient: 'from-green-500 to-emerald-600' },
    { icon: FileText, title: 'Easy Setup', description: 'No integration or tech team required - works instantly.', gradient: 'from-orange-500 to-red-600' },
    { icon: Shield, title: 'Secure & Compliant', description: 'AES-encrypted storage and verified sender IDs.', gradient: 'from-purple-500 to-pink-600' }
  ];

  const paperProblems = ['Wastes paper and printing cost', 'Fades over time and hard to track', 'No customer insights or data collected', 'No way to follow up or re-engage customers', 'Manual storage and compliance hassle'];
  const ebillBenefits = [
    'Delivered instantly via WhatsApp or SMS',
    'Automatically collects customer details',
    'Smart E-Bills carry branding, logos, and promotional banners',
    'Dynamic offers and CTAs on every Smart E-Bill',
    'Enables remarketing and rewards & coupons campaigns',
    'Saves cost, paper, and time',
    'Integrates seamlessly with analytics'
  ];
  const steps = [
    { number: '01', title: 'Print or Generate', description: 'Continue billing as usual - no changes to your workflow.' },
    { number: '02', title: 'Auto-Convert & Brand', description: 'Billbox instantly digitizes the receipt; Smart E-Bills add banners, branding, and CTAs automatically.' },
    { number: '03', title: 'Instant Delivery', description: 'Customer receives E-Bills or Smart E-Bills on WhatsApp, SMS, or Email immediately.' }
  ];

  const billOptions = [
    {
      name: 'E-Bills',
      tag: 'Standard',
      description: 'Fast, paperless receipts sent to WhatsApp, SMS, or Email with all transaction details captured.',
      features: ['Instant digital delivery', 'Secure, compliant storage', 'Customer name and contact captured'],
      accent: 'violet'
    },
    {
      name: 'Smart E-Bills',
      tag: 'Enhanced',
      description: 'Everything in E-Bills plus rich branding: promotional banners, store logo, dynamic content, and CTAs.',
      features: ['Promotional banners and offers', 'Store branding + logo on every bill', 'Dynamic content blocks and CTAs', 'Engagement tracking and re-marketing'],
      accent: 'cyan',
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <GlobalNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-6">
              <FileText className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="text-sm font-medium text-cyan-300">E-Bills + Smart E-Bills</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Goodbye Paper.
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Hello E-Bills & Smart E-Bills.</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Choose fast digital E-Bills or upgrade to Smart E-Bills with promotional banners, store branding, your logo, and dynamic content that turn every receipt into a mini-campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl">
                Start Free Trial<ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm">
                <Play className="mr-2 w-5 h-5" />See How It Works
              </Button>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} className="mt-16">
                <div className="flex flex-col items-center justify-center w-full">
                  <video
                    className="w-full max-w-2xl h-auto rounded-xl border border-white/10 shadow-lg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/placeholders/hero-ebill-poster.png"
                  >
                    <source src="/media/hero-ebill-animation.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What Is E-Bill */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-100 border border-violet-200 mb-6">
                <span className="text-sm font-semibold text-violet-700">E-Bills, Two Powerful Options</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Digital Receipts,<span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Delivered Your Way</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Billbox replaces traditional printed receipts with secure digital copies delivered instantly to your customer's WhatsApp, SMS, or Email. Choose standard E-Bills for fast, paperless delivery, or Smart E-Bills for richer engagement.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Smart E-Bills layer promotional banners, store branding, your logo, and dynamic content/CTAs on top of every receipt — so you engage customers while you bill.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-8">
                {billOptions.map(option => (
                  <div
                    key={option.name}
                    className={`relative p-6 rounded-2xl border-2 ${option.highlight ? 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-white shadow-xl' : 'border-violet-200 bg-white shadow-lg'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${option.highlight ? 'bg-cyan-100 text-cyan-700' : 'bg-violet-100 text-violet-700'}`}>{option.tag}</span>
                      <h3 className="text-xl font-bold text-gray-900">{option.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{option.description}</p>
                    <div className="space-y-3">
                      {option.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${option.highlight ? 'text-cyan-600' : 'text-violet-600'}`} />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    {option.highlight && (
                      <span className="absolute top-4 right-4 text-xs font-semibold text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full">Enhanced</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/placeholders/ebill-dashboard.png"
                    alt="E-Bill dashboard and analytics"
                    width={1200}
                    height={700}
                    className="w-full h-auto max-w-3xl rounded-xl border border-violet-200 object-contain shadow-lg"
                  />
                  
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Why Digital E-Bills<span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Beat Paper Bills</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Paper billing is slow, costly, and invisible after checkout. E-Bills modernize delivery, while Smart E-Bills add branding and offers on every receipt.</p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl p-8 border-2 border-red-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><XCircle className="w-6 h-6 text-red-600" /></div>
                <h3 className="text-2xl font-bold text-gray-900">Paper Bill Challenges</h3>
              </div>
              <ul className="space-y-4">
                {paperProblems.map((problem, i) => (
                  <li key={i} className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed">{problem}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-300 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md"><CheckCircle2 className="w-6 h-6 text-white" /></div>
                <h3 className="text-2xl font-bold text-gray-900">Smart E-Bill Advantages (Enhanced)</h3>
              </div>
              <ul className="space-y-4">
                {ebillBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-relaxed font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Advantages Grid */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Advantages of<span className="block bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Billbox E-Bills & Smart E-Bills</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Everything you need to keep billing digital, branded, and revenue-ready with Smart E-Bills.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((adv, i) => {
              const Icon = adv.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-violet-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${adv.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{adv.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{adv.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              How It Works<span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">In Just 3 Simple Steps</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Seamlessly integrates into your existing workflow without technical hassle.</p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="relative bg-white rounded-2xl p-8 border-2 border-violet-200 shadow-lg hover:shadow-2xl transition-all">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">{step.number}</div>
                </div>
                <div className="mt-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/placeholders/ebill-how-it-works.png"
                  alt="Phone mockup showing how E-Bills work"
                  width={1200}
                  height={900}
                  className="w-full h-auto max-w-3xl rounded-xl border border-violet-200 object-contain shadow-lg"
                />
               
              </div>
          </motion.div>
        </div>
      </section>

      {/* Impact & Results */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Real Impact,<span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Proven Results</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">Join hundreds of businesses already transforming with Billbox E-Bills and Smart E-Bills.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[{ stat: '8K+', label: 'Digital Bills Sent', icon: FileText }, { stat: '50%', label: 'Cost Savings', icon: TrendingUp }, { stat: '45%', label: 'Returning Customers', icon: Users }].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-all">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{item.stat}</div>
                  <div className="text-gray-300 font-medium">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[{ quote: "Billbox helped us go fully digital within a week — customers love getting bills on WhatsApp!", author: "Sakesh Kumar", role: "Owner,  Retail" },
              { quote: "Switching to Smart E-Bills lets us run offers and branding on every receipt while saving cost.", author: "Priya Sharma", role: "Manager, Fashion Hub" }].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                <Quote className="w-10 h-10 text-cyan-400 mb-4" />
                <p className="text-lg text-gray-200 mb-6 leading-relaxed italic">"{t.quote}"</p>
                <div><div className="font-bold text-white">{t.author}</div>
                  <div className="text-sm text-gray-400">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental Impact */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
                <Leaf className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-semibold text-green-700">Environmental Impact</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">
                Go Paperless.<span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Save Trees. Build Trust.</span>
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Every digital receipt reduces paper waste and your carbon footprint. Billbox helps your business go green without sacrificing convenience.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Show customers you care about the environment while building a modern, sustainable business that stands out from competitors.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/placeholders/eco-impact.png"
                    alt="Trees and digital receipts visual"
                    width={1200}
                    height={800}
                    className="w-full h-auto max-w-3xl rounded-xl border border-green-200 object-contain shadow-lg"
                  />
                  
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl lg:text-6xl font-extrabold mb-6">
              Start Sending<span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">E-Bills & Smart E-Bills Today.</span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Choose simple E-Bills or Smart E-Bills with branding and offers — and turn every receipt into growth.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-7 text-lg font-semibold rounded-xl shadow-2xl hover:scale-105 transition-all">
                Start Free Trial<ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white bg-white/5 hover:bg-white/10 px-10 py-7 text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all">
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

export default EBillProduct;
