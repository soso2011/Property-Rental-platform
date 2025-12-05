"use client";
import { Shield, Eye, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum && window.ethereum.selectedAddress) {
        setIsConnected(true);
        setWalletAddress(window.ethereum.selectedAddress);
      }
    };

    checkConnection();
  }, []);
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setIsConnected(true)
        setWalletAddress(accounts[0])
      } catch (error) {
        console.error("Error connecting to MetaMask", error)
      }
    } else {
      alert("Please install MetaMask to use this feature")
    }
  }
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-[#3C4043] mb-12">
          About Our Platform
        </h1>

        {/* Hero Section */}
        <Card className="bg-white mb-16">
          <CardContent className="pt-6 px-6 md:px-8 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#3C4043] mb-4">
                  Revolutionizing Property Rentals with Blockchain
                </h2>
                <p className="text-[#5F6368] mb-6">
                  Our decentralized platform leverages blockchain technology to
                  create a secure, transparent, and efficient property rental
                  ecosystem. We're eliminating intermediaries, reducing costs,
                  and giving control back to property owners and renters.
                </p>
                <p className="text-[#5F6368]">
                  By utilizing smart contracts, we ensure that all rental
                  agreements are automatically enforced, payments are secure,
                  and the entire process is transparent for all parties
                  involved.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md h-64 bg-gradient-to-r from-[#1A73E8]/10 to-[#FF6D00]/10 rounded-lg flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-[#1A73E8]"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.5 12H16.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 7.5V16.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      className="w-8 h-8 text-[#FF6D00]"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 22V12H15V22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Features Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#3C4043] mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Security Feature */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-[#0F9D58]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#0F9D58]" />
                </div>
                <CardTitle className="text-xl text-[#3C4043]">
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#5F6368]">
                  Blockchain technology ensures that all transactions are secure
                  and immutable. Smart contracts automatically enforce rental
                  agreements, protecting both property owners and renters.
                </p>
              </CardContent>
            </Card>

            {/* Transparency Feature */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-[#1A73E8]/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-[#1A73E8]" />
                </div>
                <CardTitle className="text-xl text-[#3C4043]">
                  Transparency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#5F6368]">
                  All rental terms, payment history, and property details are
                  stored on the blockchain, providing complete transparency for
                  all parties involved in the rental process.
                </p>
              </CardContent>
            </Card>

            {/* Ownership Feature */}
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-[#FF6D00]/10 flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-[#FF6D00]" />
                </div>
                <CardTitle className="text-xl text-[#3C4043]">
                  Ownership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#5F6368]">
                  Our platform verifies property ownership through blockchain,
                  eliminating fraud and ensuring that renters are dealing with
                  legitimate property owners.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#3C4043] mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-[#3C4043]">
                  For Property Owners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-[#5F6368]">
                  <li>Connect your wallet to our platform</li>
                  <li>
                    Verify your property ownership through our blockchain system
                  </li>
                  <li>
                    List your property with details, photos, and rental terms
                  </li>
                  <li>Receive rental payments directly to your wallet</li>
                  <li>
                    Manage your properties through our intuitive dashboard
                  </li>
                </ol>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-[#3C4043]">
                  For Renters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-[#5F6368]">
                  <li>Connect your wallet to our platform</li>
                  <li>Browse verified properties with transparent history</li>
                  <li>Contact property owners directly through the platform</li>
                  <li>Sign smart contracts for rental agreements</li>
                  <li>Make secure payments through blockchain</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3C4043] mb-6">
            Ready to Experience the Future of Property Rentals?
          </h2>
          <p className="text-[#5F6368] max-w-2xl mx-auto mb-8">
            Join our growing community of property owners and renters who are
            already benefiting from our secure, transparent, and efficient
            platform.
          </p>
          <Button
            className={`${
              isConnected
                ? "hidden"
                : "bg-[#1A73E8] hover:bg-[#1A73E8]/90 text-white px-8 py-6 text-lg rounded-md"
            }`}
            onClick={isConnected ? () => {} : connectWallet}
          >
            {isConnected ? `` : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
