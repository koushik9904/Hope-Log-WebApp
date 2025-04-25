import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageFooter } from "@/components/layout/page-footer";
import { primaryNavLinks } from "@/lib/navigation";

export default function PrivacyPolicyPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <PageHeader 
        currentPage="privacy-policy"
        navLinks={primaryNavLinks}
      />
      
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Privacy Policy</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Effective Date: April 21, 2025
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-md mb-10">
            <div className="prose max-w-none">
              <p>
                At Hope Log, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share information about you when you use our website, mobile application, and other online products and services (collectively, the "Services") or when you otherwise interact with us.
              </p>
              
              <h2>Information We Collect</h2>
              
              <h3>Information You Provide to Us</h3>
              <p>
                We collect information you provide directly to us. For example, we collect information when you:
              </p>
              <ul>
                <li>Create an account and use our Services</li>
                <li>Fill in forms or fields on our Services</li>
                <li>Create or share content such as journal entries</li>
                <li>Communicate with us via third-party platforms, email, or otherwise</li>
                <li>Respond to surveys or questionnaires</li>
                <li>Subscribe to our newsletter or sign up for our mailing list</li>
                <li>Request customer support or technical assistance</li>
              </ul>
              
              <p>
                The types of information we may collect include:
              </p>
              <ul>
                <li>Account information (name, email address, username, password)</li>
                <li>Profile information (age, gender, preferences)</li>
                <li>Journal entries and other content you create or provide</li>
                <li>Communication data (messages, feedback, support requests)</li>
                <li>Survey or questionnaire responses</li>
                <li>Any other information you choose to provide</li>
              </ul>
              
              <h3>Information We Collect Automatically</h3>
              <p>
                When you access or use our Services, we may automatically collect information about you, including:
              </p>
              <ul>
                <li>Usage Information: We collect information about your activity on our Services, such as the features you use, the actions you take, and the time, frequency, and duration of your activities.</li>
                <li>Device Information: We collect information about the device you use to access our Services, including the hardware model, operating system and version, unique device identifiers, and mobile network information.</li>
                <li>Location Information: We may collect information about your location when you access or use our Services, which may be derived from your IP address or device settings.</li>
                <li>Log Information: We collect standard server logs, which may include your IP address, browser type and settings, access times, and referring website addresses.</li>
                <li>Cookies and Similar Technologies: We use cookies and similar technologies to collect information about your interactions with our Services and other websites. See our Cookie Policy for more details.</li>
              </ul>
              
              <h2>How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul>
                <li>Provide, maintain, and improve our Services</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Develop new products and services</li>
                <li>Personalize your experience and deliver content tailored to your interests</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations</li>
              </ul>
              
              <h2>How We Share Your Information</h2>
              <p>
                We may share information about you as follows or as otherwise described in this Privacy Policy:
              </p>
              <ul>
                <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
                <li>In response to a request for information if we believe disclosure is in accordance with any applicable law, regulation, or legal process</li>
                <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of Hope Log or others</li>
                <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
                <li>With your consent or at your direction</li>
              </ul>
              
              <p>
                We may also share aggregated or de-identified information, which cannot reasonably be used to identify you.
              </p>
              
              <h2>Data Security</h2>
              <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems or your information.
              </p>
              
              <h2>Data Retention</h2>
              <p>
                We store the information we collect about you for as long as is necessary for the purpose(s) for which we originally collected it or for other legitimate business purposes, including to meet our legal, regulatory, or other compliance obligations.
              </p>
              
              <h2>Your Choices</h2>
              <p>
                You have certain choices about the information we collect and how it is used:
              </p>
              <ul>
                <li>Account Information: You may update, correct, or delete your account information at any time by logging into your account settings. Note that we may retain certain information as required by law or for legitimate business purposes.</li>
                <li>Cookies: Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject browser cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our Services.</li>
                <li>Communications: You may opt out of receiving promotional emails from Hope Log by following the instructions in those emails. If you opt out, we may still send you non-promotional emails, such as those about your account or our ongoing business relations.</li>
              </ul>
              
              <h2>Your Data Protection Rights</h2>
              <p>
                Depending on your location, you may have certain rights regarding your personal information, such as:
              </p>
              <ul>
                <li>The right to access personal information we hold about you</li>
                <li>The right to request correction of inaccurate personal information</li>
                <li>The right to request deletion of your personal information</li>
                <li>The right to object to processing of your personal information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              
              <p>
                To exercise any of these rights, please contact us at privacy@hopelog.com.
              </p>
              
              <h2>Children's Privacy</h2>
              <p>
                Our Services are not directed to children under 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us at privacy@hopelog.com.
              </p>
              
              <h2>Changes to This Privacy Policy</h2>
              <p>
                We may change this Privacy Policy from time to time. If we make material changes, we will notify you as required by applicable law. We encourage you to review the Privacy Policy whenever you access our Services to stay informed about our information practices.
              </p>
              
              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                Email: privacy@hopelog.com<br />
                Address: Hope Log, Inc.<br />
                123 Wellness Avenue<br />
                Mentalville, CA 94103<br />
                United States
              </p>
            </div>
          </div>
          
          <div className="text-center mb-10">
            <p className="text-gray-500 mb-6">
              This Privacy Policy was last updated on April 21, 2025
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/terms-of-service">
                <Button variant="outline">
                  Terms of Service
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-[#F5B8DB] hover:bg-[#F5B8DB]/90">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <PageFooter />
    </div>
  );
}