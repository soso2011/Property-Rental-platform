import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-[#3C4043] mb-12">
          Privacy Policy
        </h1>

        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm mb-12">
          <p className="text-[#5F6368] mb-8">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <p className="text-[#3C4043] mb-8">
            At our Decentralized Property Rental Platform, we take your privacy
            seriously. This Privacy Policy explains how we collect, use, and
            protect your information when you use our blockchain-based rental
            platform.
          </p>

          {/* Privacy Policy Accordion */}
          <Accordion
            type="single"
            collapsible
            className="mb-8 border-[#E0E0E0]"
          >
            <AccordionItem value="item-1" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                1. Data Collection
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>1.1 Blockchain Data:</strong> By nature of
                    blockchain technology, transaction data including wallet
                    addresses, smart contract interactions, and transaction
                    amounts are publicly recorded on the blockchain.
                  </p>
                  <p>
                    <strong>1.2 Account Information:</strong> We collect
                    information you provide when creating a profile, such as
                    your username, email address, and profile picture.
                  </p>
                  <p>
                    <strong>1.3 Property Information:</strong> If you list a
                    property, we collect details about the property including
                    location, features, images, and rental terms.
                  </p>
                  <p>
                    <strong>1.4 Communication Data:</strong> We store messages
                    exchanged between users on our platform for dispute
                    resolution purposes.
                  </p>
                  <p>
                    <strong>1.5 Usage Data:</strong> We collect data about how
                    you interact with our platform, including log data, device
                    information, and browsing patterns.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                2. Use of Information
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>2.1 Platform Functionality:</strong> We use your
                    information to provide, maintain, and improve our platform
                    services, including property listings, smart contract
                    execution, and user communications.
                  </p>
                  <p>
                    <strong>2.2 Verification:</strong> We use property
                    information to verify ownership through blockchain
                    verification systems.
                  </p>
                  <p>
                    <strong>2.3 Communication:</strong> We use your contact
                    information to send you important updates about the
                    platform, your account, and transactions.
                  </p>
                  <p>
                    <strong>2.4 Dispute Resolution:</strong> We may use
                    communication data and transaction history in the event of
                    disputes between users.
                  </p>
                  <p>
                    <strong>2.5 Analytics:</strong> We analyze usage patterns to
                    improve our platform, enhance user experience, and develop
                    new features.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                3. Blockchain Privacy Considerations
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>3.1 Public Ledger:</strong> Users should be aware
                    that blockchain transactions are recorded on a public ledger
                    and are visible to anyone. While wallet addresses don't
                    directly identify individuals, transaction patterns may
                    potentially be linked to identities.
                  </p>
                  <p>
                    <strong>3.2 Smart Contracts:</strong> The terms and
                    conditions of rental agreements executed through smart
                    contracts are stored on the blockchain and are publicly
                    accessible.
                  </p>
                  <p>
                    <strong>3.3 Wallet Security:</strong> We do not have access
                    to your private keys or wallet recovery phrases. You are
                    solely responsible for maintaining the security of your
                    wallet.
                  </p>
                  <p>
                    <strong>3.4 Pseudonymity:</strong> While blockchain
                    addresses are pseudonymous, we recommend users take
                    additional precautions if they wish to maintain privacy.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                4. Security Measures
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>4.1 Data Protection:</strong> We implement
                    appropriate technical and organizational measures to protect
                    your personal information against unauthorized access,
                    alteration, disclosure, or destruction.
                  </p>
                  <p>
                    <strong>4.2 Smart Contract Audits:</strong> Our smart
                    contracts undergo rigorous security audits by independent
                    third parties to identify and address potential
                    vulnerabilities.
                  </p>
                  <p>
                    <strong>4.3 Encryption:</strong> We use encryption to
                    protect sensitive information transmitted through our
                    platform.
                  </p>
                  <p>
                    <strong>4.4 Access Controls:</strong> We restrict access to
                    personal information to employees, contractors, and agents
                    who need to know that information to process it for us.
                  </p>
                  <p>
                    <strong>4.5 Regular Reviews:</strong> We regularly review
                    our information collection, storage, and processing
                    practices to guard against unauthorized access.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                5. Third-Party Sharing
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>5.1 Service Providers:</strong> We may share your
                    information with third-party service providers who perform
                    services on our behalf, such as hosting, analytics, and
                    customer support.
                  </p>
                  <p>
                    <strong>5.2 Legal Requirements:</strong> We may disclose
                    your information if required to do so by law or in response
                    to valid requests by public authorities.
                  </p>
                  <p>
                    <strong>5.3 Business Transfers:</strong> In the event of a
                    merger, acquisition, or asset sale, your information may be
                    transferred as a business asset. We will notify you before
                    your information is transferred and becomes subject to a
                    different privacy policy.
                  </p>
                  <p>
                    <strong>5.4 With Your Consent:</strong> We may share your
                    information with third parties when we have your consent to
                    do so.
                  </p>
                  <p>
                    <strong>5.5 Blockchain Data:</strong> Information recorded
                    on the blockchain is publicly accessible and not controlled
                    by us.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                6. User Rights
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>6.1 Access and Update:</strong> You can access and
                    update your profile information through your account
                    settings.
                  </p>
                  <p>
                    <strong>6.2 Data Portability:</strong> You can request a
                    copy of your personal data in a structured, commonly used,
                    and machine-readable format.
                  </p>
                  <p>
                    <strong>6.3 Deletion:</strong> You can request deletion of
                    your account and personal information, although information
                    recorded on the blockchain cannot be deleted due to the
                    immutable nature of blockchain technology.
                  </p>
                  <p>
                    <strong>6.4 Objection:</strong> You have the right to object
                    to the processing of your personal data in certain
                    circumstances.
                  </p>
                  <p>
                    <strong>6.5 Limitation:</strong> You have the right to
                    request restriction of processing of your personal data.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                7. Cookies and Tracking
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>7.1 Cookies:</strong> We use cookies and similar
                    tracking technologies to track activity on our platform and
                    hold certain information to improve user experience.
                  </p>
                  <p>
                    <strong>7.2 Analytics:</strong> We use analytics services to
                    understand how users interact with our platform. These
                    services may use cookies and similar technologies to collect
                    information.
                  </p>
                  <p>
                    <strong>7.3 Do Not Track:</strong> We currently do not
                    respond to "Do Not Track" signals across all our services.
                  </p>
                  <p>
                    <strong>7.4 Control:</strong> You can control cookie
                    settings through your browser preferences. However,
                    disabling certain cookies may limit your ability to use some
                    features of our platform.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-[#3C4043] mb-8">
            By using our platform, you consent to the collection and use of
            information as described in this Privacy Policy. We may update this
            policy from time to time, and we will notify you of any changes by
            posting the new policy on this page.
          </p>

          {/* Acknowledgment Button */}
          <div className="text-center">
            <Link href="/" passHref>
              <Button className="bg-[#FF6D00] hover:bg-[#FF6D00]/90 text-white px-8">
                Understood
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-[#5F6368] text-sm">
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <Link
              href="mailto:privacy@decentralizedrentals.com"
              className="text-[#1A73E8] hover:underline"
            >
              privacy@decentralizedrentals.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
