
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-[#3C4043] mb-12">
          Terms & Conditions
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
            Please read these Terms and Conditions carefully before using our
            Decentralized Property Rental Platform. By accessing or using the
            platform, you agree to be bound by these Terms.
          </p>

          {/* Terms Accordion */}
          <Accordion
            type="single"
            collapsible
            className="mb-8 border-[#E0E0E0]"
          >
            <AccordionItem value="item-1" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                1. User Responsibilities
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>1.1 Account Security:</strong> You are responsible
                    for maintaining the security of your wallet and private
                    keys. We cannot recover lost keys or funds.
                  </p>
                  <p>
                    <strong>1.2 Accurate Information:</strong> You must provide
                    accurate and truthful information when listing properties or
                    engaging in rental agreements.
                  </p>
                  <p>
                    <strong>1.3 Legal Compliance:</strong> You are responsible
                    for ensuring that your use of the platform complies with all
                    applicable laws and regulations in your jurisdiction.
                  </p>
                  <p>
                    <strong>1.4 Prohibited Activities:</strong> You may not use
                    the platform for any illegal activities, fraud, harassment,
                    or any actions that may harm other users or the platform
                    itself.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                2. Property Listings
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>2.1 Ownership Verification:</strong> Property owners
                    must verify ownership through our blockchain verification
                    system before listing properties.
                  </p>
                  <p>
                    <strong>2.2 Listing Accuracy:</strong> All property listings
                    must accurately represent the property, including its
                    condition, amenities, and availability.
                  </p>
                  <p>
                    <strong>2.3 Pricing Transparency:</strong> All fees,
                    deposits, and rental costs must be clearly stated in the
                    listing.
                  </p>
                  <p>
                    <strong>2.4 Listing Removal:</strong> We reserve the right
                    to remove listings that violate our terms or that we
                    determine to be fraudulent or misleading.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                3. Smart Contracts & Payments
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>3.1 Smart Contract Execution:</strong> Rental
                    agreements are executed through smart contracts on the
                    blockchain. Once signed, these contracts are immutable and
                    will execute automatically according to their terms.
                  </p>
                  <p>
                    <strong>3.2 Payment Processing:</strong> All payments are
                    processed through the blockchain. We do not handle or store
                    any funds directly.
                  </p>
                  <p>
                    <strong>3.3 Transaction Fees:</strong> Blockchain
                    transaction fees are separate from rental costs and are the
                    responsibility of the user initiating the transaction.
                  </p>
                  <p>
                    <strong>3.4 Refunds:</strong> Refunds are governed by the
                    terms specified in each smart contract. We cannot override
                    or modify smart contracts once they are deployed.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                4. Dispute Resolution
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>4.1 Dispute Process:</strong> In case of disputes
                    between property owners and renters, our platform provides a
                    decentralized arbitration mechanism.
                  </p>
                  <p>
                    <strong>4.2 Arbitration:</strong> Disputes will be resolved
                    by a panel of randomly selected community members who stake
                    tokens to participate in the arbitration process.
                  </p>
                  <p>
                    <strong>4.3 Evidence Submission:</strong> Both parties must
                    submit evidence to support their claims within the timeframe
                    specified in the dispute notification.
                  </p>
                  <p>
                    <strong>4.4 Binding Decisions:</strong> Arbitration
                    decisions are final and will be automatically executed
                    through the smart contract.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                5. Platform Modifications
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>5.1 Updates:</strong> We may update or modify the
                    platform, including these Terms, at any time. Continued use
                    of the platform after such changes constitutes acceptance of
                    the new Terms.
                  </p>
                  <p>
                    <strong>5.2 Feature Changes:</strong> We may add, remove, or
                    modify features of the platform at our discretion.
                  </p>
                  <p>
                    <strong>5.3 Notification:</strong> We will make reasonable
                    efforts to notify users of significant changes to the
                    platform or these Terms.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                6. Limitation of Liability
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>6.1 No Guarantees:</strong> We do not guarantee the
                    accuracy, completeness, or quality of any listings or user
                    interactions on the platform.
                  </p>
                  <p>
                    <strong>6.2 Smart Contract Risks:</strong> Users acknowledge
                    the inherent risks of blockchain technology and smart
                    contracts, including potential bugs or vulnerabilities.
                  </p>
                  <p>
                    <strong>6.3 Indirect Damages:</strong> We are not liable for
                    any indirect, incidental, special, consequential, or
                    punitive damages resulting from your use of the platform.
                  </p>
                  <p>
                    <strong>6.4 Maximum Liability:</strong> Our maximum
                    liability for any claims arising from these Terms or your
                    use of the platform is limited to the amount of fees you
                    have paid to us.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-[#E0E0E0]">
              <AccordionTrigger className="text-[#3C4043] font-semibold">
                7. Termination
              </AccordionTrigger>
              <AccordionContent className="text-[#5F6368]">
                <div className="space-y-4">
                  <p>
                    <strong>7.1 User Termination:</strong> You may stop using
                    the platform at any time, but any active smart contracts
                    will continue to execute according to their terms.
                  </p>
                  <p>
                    <strong>7.2 Platform Termination:</strong> We reserve the
                    right to terminate or suspend your access to the platform
                    for violations of these Terms or for any other reason at our
                    discretion.
                  </p>
                  <p>
                    <strong>7.3 Effect of Termination:</strong> Upon
                    termination, your right to use the platform will immediately
                    cease, but all provisions of these Terms that by their
                    nature should survive termination shall survive.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-[#3C4043] mb-8">
            By using our platform, you acknowledge that you have read,
            understood, and agree to be bound by these Terms and Conditions. If
            you do not agree with any part of these Terms, you must not use our
            platform.
          </p>

          {/* Accept Button */}
          <div className="text-center">
            <Link href="/" passHref>
              <Button className="bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white px-8">
                I Accept
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-[#5F6368] text-sm">
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <Link
              href="mailto:legal@decentralizedrentals.com"
              className="text-[#1A73E8] hover:underline"
            >
              legal@decentralizedrentals.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
