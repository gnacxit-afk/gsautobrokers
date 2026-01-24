
import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="bg-white dark:bg-gray-900 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-slate-700 dark:text-slate-300">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#111418] dark:text-white">Terms of Service</h1>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">GS Autobrokers</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Effective Date: January 23, 2026</p>
        </div>

        <div className="space-y-8 prose prose-slate dark:prose-invert max-w-none">
          <p>
            Welcome to GS Autobrokers (“GS Autobrokers,” “Company,” “we,” “us,” or “our”). These Terms of Service (“Terms”) govern your access to and use of our website, digital platforms, communications, and vehicle brokerage services (collectively, the “Services”).
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, you must not use our Services.
          </p>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">1. Scope of Services</h2>
            <p>GS Autobrokers provides services including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vehicle brokerage and sourcing</li>
              <li>Lead generation and customer matching</li>
              <li>Vehicle purchase coordination</li>
              <li>Financing and lender referral assistance</li>
              <li>Trade-in facilitation</li>
              <li>Customer communications and support</li>
              <li>Educational and certification-related content (where applicable)</li>
            </ul>
            <p className="mt-2">GS Autobrokers acts as a broker and intermediary, not a manufacturer or lender, unless explicitly stated otherwise.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">2. Eligibility</h2>
            <p>By using our Services, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are at least 18 years old</li>
              <li>You have legal authority to enter binding agreements</li>
              <li>All information you provide is accurate and truthful</li>
            </ul>
            <p className="mt-2">We reserve the right to refuse service to any user at our discretion.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and complete personal and financial information</li>
              <li>Use the Services only for lawful purposes</li>
              <li>Not engage in fraud, misrepresentation, or deceptive activity</li>
              <li>Maintain confidentiality of account credentials</li>
              <li>Not interfere with system security, functionality, or integrity</li>
            </ul>
             <p className="mt-2">You are responsible for all activity conducted under your account.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">4. Vehicle Availability & Pricing Disclaimer</h2>
            <p>Vehicle availability, pricing, financing rates, and incentives:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Are subject to change without notice</li>
                <li>Depend on third-party dealers, lenders, and inventory providers</li>
                <li>Are not guaranteed until confirmed in writing</li>
            </ul>
            <p className="mt-2">Advertised pricing does not constitute a binding offer until final contractual agreement is signed.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">5. Brokerage Role & No Guarantee Clause</h2>
            <p>GS Autobrokers:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Does not guarantee vehicle availability</li>
                <li>Does not guarantee financing approval</li>
                <li>Does not guarantee interest rates, loan terms, or trade-in values</li>
                <li>Does not control lender underwriting decisions or dealership inventory</li>
            </ul>
            <p className="mt-2">We act as a facilitator and advocate but cannot ensure outcomes dependent on third parties.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">6. Financing & Credit Applications</h2>
            <p>If you submit a credit or financing request:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>You authorize us to share your information with lenders and credit bureaus</li>
                <li>Loan approvals are determined solely by financial institutions</li>
                <li>GS Autobrokers is not responsible for lender decisions</li>
                <li>You certify that all submitted information is accurate and truthful</li>
            </ul>
            <p className="mt-2">Providing false information may result in service termination and legal action.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">7. Payments, Fees & Deposits</h2>
            <p>Certain services may require:</p>
             <ul className="list-disc pl-6 space-y-1">
                <li>Brokerage service fees</li>
                <li>Vehicle reservation deposits</li>
                <li>Administrative or processing fees</li>
            </ul>
            <p className="mt-2">All payments:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Are non-refundable unless explicitly stated in writing</li>
                <li>Must comply with posted payment terms</li>
                <li>May be forfeited if transactions are canceled by the customer without valid cause</li>
            </ul>
            <p className="mt-2">Refunds, if applicable, are issued at GS Autobrokers’ discretion.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">8. Vehicle Condition & Inspection Disclaimer</h2>
            <p>Vehicles may be sourced from dealers, auctions, or third-party sellers.</p>
            <p>GS Autobrokers:</p>
             <ul className="list-disc pl-6 space-y-1">
                <li>Does not manufacture vehicles</li>
                <li>Does not provide mechanical guarantees unless explicitly stated</li>
                <li>Encourages customers to conduct independent inspections</li>
                <li>Is not responsible for defects not disclosed by sellers</li>
            </ul>
            <p className="mt-2">Manufacturer warranties or dealer warranties apply where available.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">9. Test Drives, Delivery & Ownership Transfer</h2>
            <p>Customers acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Test drives are subject to dealer approval</li>
                <li>Title, registration, and ownership transfer depend on state regulations</li>
                <li>Delivery timelines vary based on logistics and inventory</li>
                <li>Insurance coverage may be required prior to vehicle release</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">10. Marketing Communications & Consent</h2>
            <p>By using our Services, you consent to receiving:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Email notifications</li>
                <li>SMS and WhatsApp communications</li>
                <li>Phone calls, including automated systems (where legally permitted)</li>
            </ul>
            <p className="mt-2">You may opt-out at any time, subject to applicable laws.</p>
          </section>

           <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">11. Intellectual Property</h2>
            <p>All website content, branding, designs, text, software, logos, training materials, and media are the exclusive property of GS Autobrokers.</p>
            <p className="mt-2">You may not copy, reproduce, distribute, or exploit any content without written permission.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">12. Prohibited Activities</h2>
            <p>Users may not:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Submit fraudulent credit or identity information</li>
                <li>Attempt to bypass security systems</li>
                <li>Reverse engineer our systems</li>
                <li>Use the platform to solicit illegal services</li>
                <li>Harass employees, agents, or customers</li>
            </ul>
            <p className="mt-2">Violations may result in immediate termination and legal action.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">13. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>GS Autobrokers shall not be liable for indirect, incidental, or consequential damages</li>
                <li>We are not responsible for third-party actions, lenders, or dealerships</li>
                <li>Total liability shall not exceed fees paid by the user in the preceding six months</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">14. Indemnification</h2>
            <p>You agree to indemnify and hold harmless GS Autobrokers from claims arising from:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Your misuse of Services</li>
                <li>False information provided</li>
                <li>Violations of law or these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">15. Third-Party Services & Links</h2>
            <p>Our Services may include links or integrations with third-party platforms (dealers, lenders, CRMs, messaging providers).</p>
            <p className="mt-2">GS Autobrokers is not responsible for third-party practices or content.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">16. Termination of Services</h2>
            <p>We may suspend or terminate access:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>For violations of these Terms</li>
                <li>For fraudulent or harmful conduct</li>
                <li>At our sole discretion, with or without notice</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">17. Governing Law & Dispute Resolution</h2>
            <p>These Terms shall be governed by the laws of the United States and the State where GS Autobrokers is registered.</p>
            <p>Any disputes shall be resolved through:</p>
            <ul className="list-disc pl-6 space-y-1">
                <li>Negotiation</li>
                <li>Mediation or arbitration (where applicable)</li>
                <li>Courts within the governing jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">18. Modifications to These Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of our Services constitutes acceptance of updates.</p>
          </section>

          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">19. Force Majeure</h2>
            <p>We shall not be liable for delays or failures caused by events beyond reasonable control, including natural disasters, system outages, or regulatory changes.</p>
          </section>
          
          <section>
            <h2 className="font-bold text-2xl mt-8 mb-4 text-[#111418] dark:text-white">20. Contact Information</h2>
            <address className="not-italic space-y-1">
              <p>GS Autobrokers</p>
              <p>📧 legal@esautobrokers.com</p>
              <p>📞 +1 (832) 400-5373</p>
              <p>📍 United States</p>
            </address>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
