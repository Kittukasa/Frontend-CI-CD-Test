import React from 'react';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  React.useEffect(() => {
    document.title = 'Privacy Policy - Billbox';
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <GlobalNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg">How we collect, use, and protect your information</p>
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
                At <strong>Bill Box</strong>, we respect your privacy and are committed to
                protecting your personal information. This Privacy Policy explains how we collect,
                use, disclose, and safeguard information when you use our platform. It applies to
                all users, including visitors who browse our website without creating an account
                ("Visitors") and registered users who engage with our services ("Authorized
                Customers").
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                We encourage you to read this policy carefully to understand how we handle your
                data.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                1. What is Personally Identifiable Information (PII)?
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                "Personally Identifiable Information" (PII) means any data that identifies or can be
                used to identify, contact, or locate an individual.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Examples of PII we may collect include:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Full name, email address, and phone number</li>
                <li>
                  Business details such as company name, address, GST number, or other registration
                  details
                </li>
                <li>Billing and payment information</li>
                <li>Login credentials (username and password)</li>
                <li>
                  Device information (IP address, browser type, operating system, device model)
                </li>
                <li>Interaction data such as logs of messages, usage patterns, and preferences</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                Data collected in a way that does not personally identify you (such as aggregated
                statistics or anonymized information) is <em>not considered PII</em>.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                2. Information We Collect
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information in different ways, depending on how you interact with our
                services:
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-4">From Visitors:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mb-6">
                <li>
                  Basic browsing information, including IP address, device type, and pages viewed
                </li>
                <li>Referral sources (how you arrived at our website)</li>
                <li>Session duration and activity logs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                From Authorized Customers:
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Registration details (full name, email, mobile number, password)</li>
                <li>Business information (company name, address, tax details)</li>
                <li>Payment and billing records when using our paid services</li>
                <li>
                  Data related to use of Bill Box features (e.g., uploaded bills, generated
                  invoices, campaign details if applicable)
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                3. How We Collect Information
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">We collect information through:</p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Direct Input</strong>: When users sign up, update profiles, or fill out
                  forms.
                </li>
                <li>
                  <strong>Service Usage</strong>: Automatically through cookies, analytics tools,
                  and session tracking.
                </li>
                <li>
                  <strong>Third Parties</strong>: Payment gateways, hosting providers, or
                  communication platforms integrated with Bill Box may provide data necessary to
                  deliver our services.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                4. How We Use the Information
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We use collected data responsibly and only for the purposes of:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Service Delivery</strong>: To provide and operate Bill Box features such
                  as billing, invoicing, notifications, and communication.
                </li>
                <li>
                  <strong>Personalization</strong>: To tailor services and recommendations to
                  individual users.
                </li>
                <li>
                  <strong>Transactions</strong>: To process payments, confirm receipts, and manage
                  financial records.
                </li>
                <li>
                  <strong>Communication</strong>: To send service alerts, reminders, promotional
                  campaigns, or account-related updates.
                </li>
                <li>
                  <strong>Support</strong>: To respond to queries, troubleshoot issues, and provide
                  customer care.
                </li>
                <li>
                  <strong>Improvement</strong>: To analyze usage patterns, monitor system
                  performance, and enhance user experience.
                </li>
                <li>
                  <strong>Legal Compliance</strong>: To meet regulatory requirements and prevent
                  fraud or abuse.
                </li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                We may also use anonymized or aggregated information for analytics, research, or
                reporting.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                5. Sharing of Information
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box does not sell or rent your data. We only share information under the
                following conditions:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>With Third-Party Service Providers</strong>: Trusted partners such as
                  hosting providers, payment processors, and communication platforms may receive
                  limited access to PII to fulfill their functions. They are bound by strict
                  confidentiality and data protection obligations.
                </li>
                <li>
                  <strong>Between Customers</strong>: Certain transactions (e.g., bill sharing,
                  invoice delivery) may require sharing limited details with other Bill Box users.
                </li>
                <li>
                  <strong>Legal Requirements</strong>: If required by law, regulation, or legal
                  proceedings, we may disclose data to authorities or regulators.
                </li>
                <li>
                  <strong>Business Transfers</strong>: In case of a merger, acquisition, or
                  restructuring, user data may be transferred, but it will remain protected under
                  this Privacy Policy.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                6. Data Storage and Security
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We take your data security seriously and implement the following safeguards:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  All sensitive data (like payment details) is encrypted during transmission using
                  SSL.
                </li>
                <li>Passwords are stored securely with hashing and encryption mechanisms.</li>
                <li>Access to PII is restricted to authorized employees and partners only.</li>
                <li>Regular monitoring and audits are conducted to prevent breaches.</li>
                <li>Backup systems ensure data recovery in case of accidental loss.</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                While we adopt industry-standard practices, no system is fully immune from risks.
                Users are encouraged to use strong passwords and keep login details confidential.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                7. Cookies and Tracking Technologies
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box uses cookies and similar technologies to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Maintain user sessions and keep you logged in</li>
                <li>Store user preferences for faster navigation</li>
                <li>Monitor site traffic and measure campaign effectiveness</li>
                <li>Automatically log users out after inactivity for security</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                You may disable cookies through your browser, but this may limit functionality.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                8. User Rights and Choices
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Users have full control over their data and may exercise the following rights:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Access</strong>: Request a copy of your personal data stored by Bill Box.
                </li>
                <li>
                  <strong>Correction</strong>: Update or correct inaccurate information.
                </li>
                <li>
                  <strong>Deletion</strong>: Request deactivation or deletion of your account and
                  data.
                </li>
                <li>
                  <strong>Opt-Out</strong>: Unsubscribe from promotional communications at any time.
                </li>
                <li>
                  <strong>Portability</strong>: Request transfer of your data in a structured
                  digital format (where applicable).
                </li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                We will respond to requests within the timelines required by law.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                9. Data Retention
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We retain personal information only for as long as necessary to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide services to users</li>
                <li>Comply with legal and tax obligations</li>
                <li>Resolve disputes and enforce agreements</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                After termination or deactivation, some data may remain in backup archives but will
                not be used or disclosed further.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                10. Third-Party Links
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform may contain links to third-party websites or applications. These sites
                are not operated by Bill Box, and we are not responsible for their privacy
                practices. We recommend reviewing their privacy policies before sharing any
                information.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                11. Changes to this Privacy Policy
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                Bill Box reserves the right to modify this Privacy Policy at any time. When
                significant updates are made, we will notify users by:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Posting the revised policy on this page</li>
                <li>Updating the "Effective Date" above</li>
                <li>Sending direct communication if the changes significantly affect data usage</li>
              </ul>
            </section>

            {/* Contact Section */}
            <section className="mb-12 bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;
