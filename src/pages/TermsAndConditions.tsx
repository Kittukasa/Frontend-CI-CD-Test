import React from 'react';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';

const TermsAndConditions = () => {
  React.useEffect(() => {
    document.title = 'Terms & Conditions - Billbox';
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <GlobalNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
          <p className="text-gray-400 text-lg">Terms of service for using Billbox platform</p>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Effective Date:</strong> June 15, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-12">
              <p className="text-gray-700 leading-relaxed text-lg mb-6">
                Welcome to <strong>Bill Box</strong>. These Terms and Conditions ("Terms") govern
                your use of our platform and services. By accessing or using Bill Box, you agree to
                be bound by these Terms. If you do not agree with any part of these Terms, you must
                not use our services.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                These Terms apply to all users, including visitors, registered customers, and
                business partners who interact with our platform.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                1. Definitions
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                For the purposes of these Terms, the following definitions apply:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>"Bill Box" or "we" or "us"</strong>: Refers to the platform, its
                  operators, and associated entities.
                </li>
                <li>
                  <strong>"User" or "you"</strong>: Any individual or entity that accesses or uses
                  our services.
                </li>
                <li>
                  <strong>"Services"</strong>: All features, tools, and functionalities provided
                  through the Bill Box platform.
                </li>
                <li>
                  <strong>"Content"</strong>: Any data, text, images, documents, or other materials
                  uploaded or generated through our platform.
                </li>
                <li>
                  <strong>"Account"</strong>: A registered user profile that provides access to Bill
                  Box services.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                2. Acceptance of Terms
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                By creating an account, accessing, or using Bill Box in any manner, you acknowledge
                that you have read, understood, and agree to be bound by these Terms. If you do not
                agree to these Terms, you must immediately stop using our services.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms constitute a legally binding agreement between you and Bill Box. We
                reserve the right to modify these Terms at any time, and such changes will be
                effective immediately upon posting on our platform.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Your continued use of our services after any changes to these Terms constitutes your
                acceptance of the revised Terms.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                3. User Accounts and Registration
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of Bill Box, you must create an account by providing
                accurate and complete information. You are responsible for:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use of your account</li>
                <li>Ensuring that your account information remains accurate and up-to-date</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to suspend or terminate accounts that violate these Terms or
                engage in fraudulent activities.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                4. Acceptable Use Policy
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to use Bill Box only for lawful purposes and in accordance with these
                Terms. You must not:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Use the platform for any illegal, fraudulent, or unauthorized purpose</li>
                <li>Upload or transmit viruses, malware, or any harmful code</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Interfere with or disrupt the platform's functionality</li>
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Use the platform to harass, abuse, or harm others</li>
                <li>Share false, misleading, or defamatory information</li>
                <li>
                  Engage in any activity that could damage Bill Box's reputation or operations
                </li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to investigate and take appropriate action against users who
                violate this policy, including account suspension or termination.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                5. Payment Terms and Billing
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box may offer both free and paid services. For paid services:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All fees are stated in Indian Rupees (INR) unless otherwise specified</li>
                <li>
                  Payment is due immediately upon purchase or as specified in your billing cycle
                </li>
                <li>
                  We accept various payment methods including credit cards, debit cards, and digital
                  wallets
                </li>
                <li>All sales are final unless otherwise stated in our refund policy</li>
                <li>We reserve the right to change pricing with reasonable notice</li>
                <li>Failure to pay may result in service suspension or termination</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                You are responsible for all taxes, fees, and charges associated with your use of
                paid services.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                6. Intellectual Property Rights
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box and its content, features, and functionality are owned by us and are
                protected by copyright, trademark, and other intellectual property laws. You are
                granted a limited, non-exclusive, non-transferable license to use our services for
                their intended purpose.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of any content you upload to Bill Box, but you grant us a
                license to use, store, and process such content to provide our services.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                7. Disclaimers and Limitation of Liability
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box is provided "as is" and "as available" without warranties of any kind. We
                disclaim all warranties, whether express or implied, including but not limited to
                warranties of merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, Bill Box shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, including but not
                limited to loss of profits, data, or business interruption.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Our total liability for any claims arising from these Terms or your use of our
                services shall not exceed the amount you paid to us in the twelve months preceding
                the claim.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                8. Indemnification
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Bill Box and its officers,
                directors, employees, and agents from any claims, damages, losses, or expenses
                (including reasonable attorney fees) arising from your use of our services,
                violation of these Terms, or infringement of any third-party rights.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                9. Termination
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account and access to our services at any time,
                with or without notice, for any reason, including violation of these Terms.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                You may terminate your account at any time by contacting us. Upon termination, your
                right to use our services will cease immediately, but these Terms will remain in
                effect as to any prior use.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                10. Governing Law and Dispute Resolution
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India.
                Any disputes arising from these Terms or your use of our services shall be resolved
                through binding arbitration in accordance with the rules of the Indian Arbitration
                and Conciliation Act.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                The courts of Hyderabad, India shall have exclusive jurisdiction over any matters
                not subject to arbitration.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                11. Changes to Terms
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. When we make changes, we
                will update the "Effective Date" at the top of this page and notify users through
                our platform or via email.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Your continued use of our services after any changes constitutes acceptance of the
                new Terms.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                12. Miscellaneous
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining
                provisions will remain in full force and effect. Our failure to enforce any right or
                provision of these Terms will not constitute a waiver of such right or provision.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms constitute the entire agreement between you and Bill Box regarding your
                use of our services.
              </p>
            </section>

            {/* Contact Section */}
            <section className="mb-12 bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms & Conditions, please contact us:
              </p>

              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@billbox.com" className="text-cyan-600 hover:underline">
                    support@billbox.com
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> JTBI, JNTUH, KPHB, HYDERABAD
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
