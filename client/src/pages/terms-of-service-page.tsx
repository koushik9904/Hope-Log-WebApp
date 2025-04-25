import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/layout/page-header";
import { PageFooter } from "@/components/layout/page-footer";
import { primaryNavLinks } from "@/lib/navigation";

export default function TermsOfServicePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <PageHeader 
        currentPage="terms-of-service"
        navLinks={primaryNavLinks}
      />
      
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Terms of Service</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Effective Date: April 21, 2025
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-md mb-10">
            <div className="prose max-w-none">
              <p>
                Welcome to Hope Log. Please read these Terms of Service ("Terms") carefully as they contain important information about your legal rights, remedies, and obligations. By accessing or using the Hope Log website, mobile application, or any other services or products provided by Hope Log (collectively, the "Services"), you agree to be bound by these Terms.
              </p>
              
              <h2>1. Acceptance of Terms</h2>
              <p>
                By registering for, accessing, or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services. If you are accessing or using the Services on behalf of a company, organization, or other entity, then "you" means that entity, and you represent and warrant that you are authorized to bind such entity to these Terms.
              </p>
              
              <h2>2. Description of Services</h2>
              <p>
                Hope Log provides an AI-powered mental wellness journaling platform that enables users to document their thoughts and emotions, receive AI-generated insights and responses, track moods, set goals, and monitor personal growth metrics. Our Services include but are not limited to:
              </p>
              <ul>
                <li>Digital journaling tools</li>
                <li>AI conversation capabilities</li>
                <li>Mood tracking and visualization</li>
                <li>Goal setting and habit tracking</li>
                <li>Data analytics and insights</li>
                <li>Content export and backup functionality</li>
              </ul>
              
              <h2>3. Eligibility</h2>
              <p>
                You must be at least 16 years old to use our Services. By agreeing to these Terms, you represent and warrant that:
              </p>
              <ul>
                <li>You are at least 16 years of age</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will comply with these Terms</li>
                <li>If you are under 18 years old, you have obtained parental or guardian consent to use the Services</li>
              </ul>
              
              <h2>4. Account Registration and Security</h2>
              <p>
                To access certain features of our Services, you may need to register for an account. When registering, you agree to provide accurate, current, and complete information and to keep this information updated. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
              </p>
              <ul>
                <li>Create a strong password and keep it confidential</li>
                <li>Restrict access to your account</li>
                <li>Immediately notify Hope Log of any unauthorized use of your account</li>
                <li>Take responsibility for all activities occurring under your account</li>
              </ul>
              
              <h2>5. User Content</h2>
              <p>
                Our Services allow you to create, upload, store, and share content, including journal entries, comments, and other materials (collectively, "User Content"). You retain all rights to your User Content, but you grant Hope Log a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute your User Content for the purpose of providing and improving our Services.
              </p>
              <p>
                You are solely responsible for your User Content and represent and warrant that:
              </p>
              <ul>
                <li>You own or have obtained all necessary rights to your User Content</li>
                <li>Your User Content does not infringe or violate the rights of any third party</li>
                <li>Your User Content complies with all applicable laws and regulations</li>
              </ul>
              
              <h2>6. Prohibited Conduct</h2>
              <p>
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul>
                <li>Violating any applicable law, regulation, or these Terms</li>
                <li>Using the Services for any illegal purpose</li>
                <li>Impersonating another person or entity</li>
                <li>Interfering with the proper functioning of the Services</li>
                <li>Attempting to gain unauthorized access to the Services or other users' accounts</li>
                <li>Harassing, threatening, or intimidating other users</li>
                <li>Uploading malicious code or content</li>
                <li>Scraping, data mining, or extracting data from our Services without permission</li>
                <li>Using the Services to generate content that promotes harmful or illegal activities</li>
              </ul>
              
              <h2>7. Intellectual Property</h2>
              <p>
                The Services, including all content, features, and functionality, are owned by Hope Log or its licensors and are protected by copyright, trademark, patent, and other intellectual property laws. These Terms do not grant you any right, title, or interest in the Services, trademarks, or content provided by Hope Log.
              </p>
              
              <h2>8. Subscription and Payments</h2>
              <p>
                Some features of our Services may require a paid subscription. By subscribing to a paid plan, you agree to pay all fees in accordance with the pricing and payment terms presented to you. Unless otherwise stated:
              </p>
              <ul>
                <li>Subscription fees are billed in advance</li>
                <li>Subscriptions automatically renew unless canceled beforehand</li>
                <li>Fees are non-refundable except as required by law or as explicitly stated in our refund policy</li>
                <li>Hope Log reserves the right to change subscription pricing with reasonable notice</li>
              </ul>
              
              <h2>9. Termination</h2>
              <p>
                Hope Log may terminate or suspend your access to the Services at any time, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Services will immediately cease. All provisions of these Terms that should survive termination will survive, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
              
              <h2>10. Disclaimer of Warranties</h2>
              <p>
                THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, HOPE LOG DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                HOPE LOG DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THE SERVICES AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>
              <p>
                HOPE LOG IS NOT A HEALTHCARE PROVIDER, AND THE SERVICES ARE NOT INTENDED TO DIAGNOSE, TREAT, CURE, OR PREVENT ANY DISEASE OR HEALTH CONDITION. THE SERVICES ARE NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
              </p>
              
              <h2>11. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL HOPE LOG, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES OF ANY KIND ARISING FROM OR RELATING TO THE USE OF OR INABILITY TO USE THE SERVICES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, PERSONAL INJURY, OR ANY OTHER PECUNIARY LOSS.
              </p>
              <p>
                IN NO EVENT WILL HOPE LOG'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, AND CAUSES OF ACTION ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICES EXCEED THE AMOUNT PAID BY YOU TO HOPE LOG IN THE PAST TWELVE MONTHS, OR $100 IF YOU HAVE NOT MADE ANY PAYMENTS TO HOPE LOG.
              </p>
              
              <h2>12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Hope Log, its affiliates, officers, employees, agents, suppliers, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Services.
              </p>
              
              <h2>13. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising out of or relating to these Terms or the Services shall be resolved exclusively in the state or federal courts located in San Francisco County, California, and you consent to the personal jurisdiction of such courts.
              </p>
              
              <h2>14. Changes to Terms</h2>
              <p>
                Hope Log reserves the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website or through other communications. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.
              </p>
              
              <h2>15. Miscellaneous</h2>
              <p>
                These Terms constitute the entire agreement between you and Hope Log regarding the Services. If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect. Our failure to enforce any right or provision of these Terms will not be considered a waiver of such right or provision. No waiver of any part of these Terms will be effective unless in writing and signed by an authorized representative of Hope Log.
              </p>
              
              <h2>16. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                Email: terms@hopelog.com<br />
                Address: Hope Log, Inc.<br />
                123 Wellness Avenue<br />
                Mentalville, CA 94103<br />
                United States
              </p>
            </div>
          </div>
          
          <div className="text-center mb-10">
            <p className="text-gray-500 mb-6">
              These Terms of Service were last updated on April 21, 2025
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/privacy-policy">
                <Button variant="outline">
                  Privacy Policy
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