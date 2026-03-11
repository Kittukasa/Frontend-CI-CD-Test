import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Twitter, Linkedin, Github, X } from 'lucide-react';

const Footer = () => {
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (window.location.hash === '#contact' && isMobile) {
        setContactOpen(true);
      }
    };
    checkHash();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', checkHash);
      return () => window.removeEventListener('hashchange', checkHash);
    }
    return undefined;
  }, []);

  return (
    <footer id="contact" className="scroll-mt-24 bg-black text-white">
      <div className="md:hidden">
        {contactOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/70">
            <div className="w-full rounded-t-3xl border border-white/10 bg-black px-6 pb-8 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Contact Billbox</p>
                <button
                  type="button"
                  onClick={() => setContactOpen(false)}
                  className="rounded-full border border-white/20 p-2 text-white"
                  aria-label="Close contact details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 space-y-4 text-sm text-white/80">
                <a href="tel:+918008407999" className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-white/70" />
                  <span>+91 8008407999</span>
                </a>
                <a href="mailto:sales@billbox.co.in" className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-white/70" />
                  <span>sales@billbox.co.in</span>
                </a>
                <a
                  className="flex items-start gap-3"
                  href="https://www.google.com/maps/search/?api=1&query=Vaishnavi%20Cymbol%2C%203rd%20floor%2C%20A%20block%2C%20Financial%20District%2C%20Nanakramguda%2C%20Hyderabad%2C%20Telangana%20500032"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/70" />
                  <span>
                    Vaishnavi Cymbol, 3rd floor, A block, Financial District, Nanakramguda,
                    Hyderabad, Telangana 500032
                  </span>
                </a>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <a
                  href="tel:+918008407999"
                  className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-black"
                >
                  Call
                </a>
                <a
                  href="mailto:sales@billbox.co.in"
                  className="rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Email
                </a>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Vaishnavi%20Cymbol%2C%203rd%20floor%2C%20A%20block%2C%20Financial%20District%2C%20Nanakramguda%2C%20Hyderabad%2C%20Telangana%20500032"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Directions
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="md:hidden mb-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Contact
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Talk to Billbox</h3>
            <p className="mt-2 text-sm text-white/70">
              Reach us quickly from your phone.
            </p>
            <div className="mt-5 space-y-4 text-sm text-white/80">
              <a href="tel:+918008407999" className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-white/70" />
                <span>+91 8008407999</span>
              </a>
              <a href="mailto:sales@billbox.co.in" className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-white/70" />
                <span>sales@billbox.co.in</span>
              </a>
              <a
                className="flex items-start gap-3"
                href="https://www.google.com/maps/search/?api=1&query=Vaishnavi%20Cymbol%2C%203rd%20floor%2C%20A%20block%2C%20Financial%20District%2C%20Nanakramguda%2C%20Hyderabad%2C%20Telangana%20500032"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/70" />
                <span>
                  Vaishnavi Cymbol, 3rd floor, A block, Financial District, Nanakramguda,
                  Hyderabad, Telangana 500032
                </span>
              </a>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <a
                href="tel:+918008407999"
                className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-black"
              >
                Call
              </a>
              <a
                href="mailto:sales@billbox.co.in"
                className="rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Email
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Vaishnavi%20Cymbol%2C%203rd%20floor%2C%20A%20block%2C%20Financial%20District%2C%20Nanakramguda%2C%20Hyderabad%2C%20Telangana%20500032"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 rounded-full border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Directions
              </a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Billbox
              </h3>
              <p className="mt-2 text-white/70">
                Transform every transaction into an opportunity for growth.
              </p>
            </div>
            
            <div className="hidden space-y-3 md:block">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-sm">sales@billbox.co.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-sm">+91 8008407999</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/70" />
                <a
                  className="text-white/70 text-sm hover:text-white transition-colors"
                  href="https://www.google.com/maps/search/?api=1&query=Vaishnavi%20Cymbol%2C%203rd%20floor%2C%20A%20block%2C%20Financial%20District%2C%20Nanakramguda%2C%20Hyderabad%2C%20Telangana%20500032"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vaishnavi Cymbol, 3rd floor, A block, Financial District, Nanakramguda, Hyderabad, Telangana 500032
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-white/70 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#careers" className="text-white/70 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><a href="/privacy-policy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-and-conditions" className="text-white/70 hover:text-white transition-colors">Terms & Conditions</a></li>
              <li><a href="/data-deletion-policy" className="text-white/70 hover:text-white transition-colors">Data Deletion Policy</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Stay Updated</h4>
            <p className="text-white/70 text-sm mb-4">
              Get the latest updates and insights delivered to your inbox.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
              <Button 
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-white/60 text-sm">
            © 2025 Billbox. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-white/60 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
