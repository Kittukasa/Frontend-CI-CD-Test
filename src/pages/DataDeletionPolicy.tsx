import React from 'react';
import { GlobalNavbar } from '@/components/layout/GlobalNavbar';
import Footer from '@/components/Footer';

const DataDeletionPolicy = () => {
  React.useEffect(() => {
    document.title = 'Data Deletion Policy - Billbox';

    // SEO Meta Tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content =
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.';
      document.head.appendChild(meta);
    }

    // Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Data Deletion Policy | Billbox');
    } else {
      const og = document.createElement('meta');
      og.setAttribute('property', 'og:title');
      og.content = 'Data Deletion Policy | Billbox';
      document.head.appendChild(og);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute(
        'content',
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.'
      );
    } else {
      const og = document.createElement('meta');
      og.setAttribute('property', 'og:description');
      og.content =
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.';
      document.head.appendChild(og);
    }

    // Twitter Card Tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', 'Data Deletion Policy | Billbox');
    } else {
      const twitter = document.createElement('meta');
      twitter.name = 'twitter:title';
      twitter.content = 'Data Deletion Policy | Billbox';
      document.head.appendChild(twitter);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute(
        'content',
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.'
      );
    } else {
      const twitter = document.createElement('meta');
      twitter.name = 'twitter:description';
      twitter.content =
        'How to request deletion of your personal data from Billbox and how we process it under the DPDP Act of India.';
      document.head.appendChild(twitter);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <GlobalNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-black via-gray-900 to-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Data Deletion Policy</h1>
          <p className="text-gray-400 text-lg">
            How to request deletion of your personal data from Billbox
          </p>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Effective Date:</strong> August 20, 2025
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
                At <strong>BillBox.co.in</strong> ("we," "our," "us"), we respect your right to
                control your personal data. This Data Deletion Policy explains how users can request
                deletion of their data and how we handle such requests in compliance with applicable
                laws, including the Digital Personal Data Protection Act (DPDP Act) of India.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                1. User Rights to Deletion
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to request deletion of your personal information (such as name,
                email, phone number, account details, and stored bills/receipts). Once deletion is
                confirmed, we will remove your data from our systems, except where retention is
                required by law.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                2. How to Request Deletion
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                You can request data deletion by:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  Sending an email to{' '}
                  <a href="mailto:support@billbox.co.in" className="text-cyan-600 hover:underline">
                    support@billbox.co.in
                  </a>{' '}
                  with the subject line "Data Deletion Request".
                </li>
                <li>Submitting a request through your Billbox account settings (if available).</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mt-4">
                For security reasons, we may require you to verify your identity before processing
                the request.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                3. Processing Time
              </h2>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  We will acknowledge your request within <strong>7 business days</strong>.
                </li>
                <li>
                  Your data will be deleted from our active systems within <strong>30 days</strong>{' '}
                  of verification.
                </li>
                <li>
                  Some backups may take up to <strong>90 days</strong> to be fully erased, but they
                  will not be used for any active purpose.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                4. Exceptions
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We may retain certain data even after a deletion request if:
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  Required to comply with legal obligations (e.g., tax, audit, fraud prevention).
                </li>
                <li>Needed to resolve disputes or enforce our Terms & Conditions.</li>
                <li>Retention is necessary for legitimate business interests permitted by law.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                5. Deletion of Third-Party Data
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                If you have uploaded or imported third-party data (e.g., receipts, vendor or
                customer details):
              </p>

              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  You are responsible for ensuring that you have consent to process and delete that
                  data.
                </li>
                <li>Upon your request, we will delete such data from our systems.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-cyan-400">
                6. Children's Data
              </h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                We do not knowingly collect data from children under 13. If such data is identified,
                it will be deleted immediately.
              </p>
            </section>

            {/* Contact Section */}
            <section className="mb-12 bg-gray-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Contact Us</h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                For any data deletion requests or questions, please contact:
              </p>

              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>📧 Email:</strong>{' '}
                  <a href="mailto:support@billbox.co.in" className="text-cyan-600 hover:underline">
                    support@billbox.co.in
                  </a>
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

export default DataDeletionPolicy;
