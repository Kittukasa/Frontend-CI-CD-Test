import { BarChart3, TrendingUp, Users, Zap, Eye, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const DashboardPreview = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('dashboard-preview');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Zap }
  ];

  return (
    <section id="dashboard-preview" className="py-20 bg-gradient-to-b from-black to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        
        {/* 3D Command Center Image */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <img 
            src="/images/command-center-3d.svg" 
            alt="3D Command Center"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
            <Eye className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-300">Live Preview</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Your Business
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Command Center</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get a complete view of your business with real-time analytics, customer insights, and campaign performance.
          </p>

          {/* 3D Command Center Visual */}
          <div className={`mt-12 relative transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="relative max-w-4xl mx-auto">
              <img 
                src="/images/command-center-3d.svg" 
                alt="3D Command Center Dashboard"
                className="w-full h-auto rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
              
              {/* Floating Elements */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-green-500/30">
                <span className="text-green-300 text-sm font-medium">Live Data</span>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-blue-500/30">
                <span className="text-blue-300 text-sm font-medium">Real-time Analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Container */}
        <div className={`max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Browser Frame */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-t-2xl p-4 border border-slate-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="bg-slate-700/50 rounded-lg px-4 py-1 text-sm text-gray-300">
                  Sample screen from Billbox
                </div>
              </div>
              <div className="text-sm text-gray-400">Billbox Dashboard</div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl rounded-b-2xl border-x border-b border-slate-600/30 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-700/50 bg-slate-800/30">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Total Revenue</span>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">₹8,50,000</div>
                      <div className="text-green-400 text-sm">+23% this month</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Orders</span>
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">2,450</div>
                      <div className="text-purple-400 text-sm">+18% this month</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Customers</span>
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">1,234</div>
                      <div className="text-green-400 text-sm">+12% this month</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 text-sm">Avg Order</span>
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="text-2xl font-bold text-white">₹347</div>
                      <div className="text-orange-400 text-sm">+8% this month</div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-slate-600/30">
                    <h3 className="text-white font-semibold mb-4">Revenue Trend</h3>
                    <div className="flex items-end space-x-2 h-32">
                      {[40, 45, 50, 55, 60, 62, 66, 72, 70, 78, 82, 88].map((height, i) => (
                        <div 
                          key={i}
                          className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm flex-1 transition-all duration-1000 delay-300"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div className="space-y-6">
                  {/* Customer Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
                      <div className="text-2xl font-bold text-white mb-2">1,234</div>
                      <div className="text-gray-300">Total Customers</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
                      <div className="text-2xl font-bold text-white mb-2">856</div>
                      <div className="text-gray-300">Repeat Customers</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/20">
                      <div className="text-2xl font-bold text-white mb-2">₹2,340</div>
                      <div className="text-gray-300">Avg Lifetime Value</div>
                    </div>
                  </div>

                  {/* Customer List */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                    <div className="p-6 border-b border-slate-600/30">
                      <h3 className="text-white font-semibold">Recent Customers</h3>
                    </div>
                    <div className="divide-y divide-slate-600/30">
                      {[
                        { name: 'Priya Sharma', phone: '+91 98765 43210', spent: '₹2,340', type: 'Premium' },
                        { name: 'Rahul Kumar', phone: '+91 87654 32109', spent: '₹1,890', type: 'Regular' },
                        { name: 'Anita Singh', phone: '+91 76543 21098', spent: '₹3,450', type: 'High Spender' }
                      ].map((customer, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{customer.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{customer.name}</div>
                              <div className="text-gray-400 text-sm">{customer.phone}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{customer.spent}</div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              customer.type === 'High Spender' ? 'bg-purple-500/20 text-purple-300' :
                              customer.type === 'Premium' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {customer.type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'campaigns' && (
                <div className="space-y-6">
                  {/* Campaign Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
                      <div className="text-2xl font-bold text-white mb-2">24</div>
                      <div className="text-gray-300">Active Campaigns</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
                      <div className="text-2xl font-bold text-white mb-2">12,450</div>
                      <div className="text-gray-300">Messages Sent</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/20">
                      <div className="text-2xl font-bold text-white mb-2">68%</div>
                      <div className="text-gray-300">Open Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/20">
                      <div className="text-2xl font-bold text-white mb-2">₹45,000</div>
                      <div className="text-gray-300">Revenue Generated</div>
                    </div>
                  </div>

                  {/* Recent Campaigns */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 overflow-hidden">
                    <div className="p-6 border-b border-slate-600/30">
                      <h3 className="text-white font-semibold">Recent Campaigns</h3>
                    </div>
                    <div className="divide-y divide-slate-600/30">
                      {[
                        { name: 'Diwali Special Offer', status: 'Active', sent: '2,340', revenue: '₹12,500' },
                        { name: 'Weekend Sale', status: 'Completed', sent: '1,890', revenue: '₹8,900' },
                        { name: 'New Product Launch', status: 'Scheduled', sent: '0', revenue: '₹0' }
                      ].map((campaign, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                          <div>
                            <div className="text-white font-medium">{campaign.name}</div>
                            <div className="text-gray-400 text-sm">{campaign.sent} messages sent</div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-white font-semibold">{campaign.revenue}</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                campaign.status === 'Active' ? 'bg-green-500/20 text-green-300' :
                                campaign.status === 'Completed' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {campaign.status}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-xl text-gray-300 mb-6">
            Ready to see your business data like this?
          </p>
          <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 group">
            Start Your Free Trial
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
