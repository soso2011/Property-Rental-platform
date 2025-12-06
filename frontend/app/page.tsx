"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  SlidersHorizontal,
  Shield,
  FileCodeIcon as FileContract,
  Database,
  Wallet,
  Lock,
  ChevronRight,
  Star,
  ArrowRight,
  Loader2,
} from "lucide-react";
import PropertyCard from "@/components/property-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useWeb3 } from "@/components/web3-provider";
import { contractAddresses } from "@/lib/config";
import PropertyListingABI from "@/lib/abi/PropertyListing.json";
import RentalAgreementABI from "@/lib/abi/RentalAgreement.json";
import { toast } from "sonner";
import type React from "react";

// Mock testimonials data
const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Property Owner",
    content:
      "RentChain has revolutionized how I manage my rental properties. The smart contract system ensures I get paid on time, every time.",
    avatar: "/images/Sarah.webp",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Tenant",
    content:
      "I love the transparency of RentChain. My security deposit is held in escrow, giving me peace of mind that I'll get it back when I move out.",
    avatar: "/images/Michael Chen.webp",
    rating: 5,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Property Manager",
    content:
      "Managing multiple properties is so much easier with RentChain. The blockchain verification eliminates paperwork and disputes.",
    avatar: "/images/Emily Rodriguez.webp",
    rating: 4,
  },
];

// FAQ data
const faqs = [
  {
    question: "How do I rent a property?",
    answer:
      "Connect your MetaMask wallet, browse available properties, and click 'Rent Now' on the property you're interested in. Follow the prompts to complete the smart contract transaction for your rental agreement.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes, all payments are secured by Ethereum blockchain technology. Your rent payments and security deposits are managed by smart contracts, ensuring transparent and trustless transactions.",
  },
  {
    question: "How do I list my property?",
    answer:
      "Connect your wallet, click on 'List Your Property', fill in the details about your property, upload images, and set your rental terms. Once submitted, your property will be stored on IPFS and listed on our marketplace.",
  },
  {
    question: "What happens to my security deposit?",
    answer:
      "Your security deposit is held in an escrow smart contract for the duration of your lease. It will be automatically returned to your wallet when you move out, provided there are no damages or outstanding payments.",
  },
  {
    question: "Do I need cryptocurrency to use RentChain?",
    answer:
      "Yes, RentChain operates on the Ethereum blockchain, so you'll need ETH in your MetaMask wallet to pay for rent and transaction fees (gas).",
  },
];

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Define the type based on the component's props
type PropertyCardProps = React.ComponentProps<typeof PropertyCard>;

export default function Home() {
  const { provider } = useWeb3();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [properties, setProperties] = useState<PropertyCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIpfsMetadata = async (ipfsHash?: string) => {
    if (!ipfsHash || ipfsHash.startsWith("undefined")) {
      console.warn("Invalid or missing IPFS hash provided:", ipfsHash);
      return null;
    }
    const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY;
    if (!gatewayUrl) {
      console.error("IPFS Gateway URL is not configured.");
      return null;
    }
    const url = `${gatewayUrl}/ipfs/${ipfsHash}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching IPFS metadata (${ipfsHash}):`, error);
      toast.error(
        `Failed to fetch metadata for hash: ${ipfsHash.substring(0, 10)}...`
      );
      return null;
    }
  };

  useEffect(() => {
    const fetchAllProperties = async () => {
      if (!provider) {
        console.log("Provider not available yet.");
        return;
      }
      setIsLoading(true);
      try {
        const propertyListingContract = new ethers.Contract(
          contractAddresses.propertyListing,
          PropertyListingABI.abi,
          provider
        );
        const rentalAgreementContract = new ethers.Contract(
          contractAddresses.rentalAgreement,
          RentalAgreementABI.abi,
          provider
        );

        const totalPropertiesBigInt =
          await propertyListingContract.getTotalProperties();
        const totalProperties = Number(totalPropertiesBigInt);

        const propertiesPromises: Promise<PropertyCardProps | null>[] = [];

        for (let i = 1; i <= totalProperties; i++) {
          propertiesPromises.push(
            (async () => {
              try {
                const propertyData = await propertyListingContract.getProperty(
                  i
                );

                if (!propertyData || !propertyData.isListed) {
                  return null;
                }

                const metadata = await fetchIpfsMetadata(
                  propertyData.ipfsMetadataHash
                );
                const activeRentalIdBigInt =
                  await rentalAgreementContract.getActiveRentalIdForProperty(i);
                const isAvailable = activeRentalIdBigInt === 0n;

                return {
                  id: propertyData.id.toString(),
                  title: metadata?.title || "Property Title Missing",
                  location: propertyData.location,
                  price: parseFloat(
                    ethers.formatEther(propertyData.pricePerMonth)
                  ),
                  image: metadata?.imageUrl || "/placeholder.svg",
                  bedrooms: Number(propertyData.bedrooms),
                  bathrooms: Number(propertyData.bathrooms),
                  area: Number(propertyData.areaSqMeters),
                  isAvailable: isAvailable,
                  amenities: Array.isArray(metadata?.amenities)
                    ? [...metadata.amenities]
                    : [],
                  ipfsMetadataHash: propertyData.ipfsMetadataHash,
                };
              } catch (error) {
                console.error(
                  `Error fetching details for property ID ${i}:`,
                  error
                );
                return null;
              }
            })()
          );
        }

        const results = await Promise.all(propertiesPromises);
        // Filter out null results
        const validProperties = results.filter(
          (p): p is PropertyCardProps => p !== null
        );

        // Deep clone to ensure plain objects before setting state
        const plainProperties = JSON.parse(JSON.stringify(validProperties));

        setProperties(plainProperties);
      } catch (error) {
        console.error("Error fetching total properties or contracts:", error);
        toast.error("Failed to fetch property listings", {
          description:
            error instanceof Error
              ? error.message
              : "Could not connect to the blockchain or contracts.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProperties();
  }, [provider]);

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "available") return matchesSearch && property.isAvailable;
    if (activeTab === "rented") return matchesSearch && !property.isAvailable;

    return matchesSearch;
  });

  return (
    <div className="flex flex-col">
      {/* Enhanced Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="/images/hero.jpg"
            alt="Real estate background"
            fill
            className="object-cover"
          />
        </div>
        <div className="container relative z-10 py-16 md:py-24 lg:py-32">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <motion.div
              className="space-y-6"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight gradient-text">
                Rent & List Properties Securely with Blockchain
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                A decentralized way to list, rent, and manage properties with
                smart contracts & crypto payments.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#properties"
                  className="transition-all duration-200 ease-in-out hover:underline"
                >
                  <Button size="lg" className="web3-button">
                    Explore Properties
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/list-property">
                  <Button
                    size="lg"
                    variant="outline"
                    className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
                  >
                    List Your Property
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="bg-card rounded-xl border shadow-lg p-6"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h2 className="text-2xl font-semibold mb-4">
                Find Your Perfect Rental
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location or property name"
                    className="pl-9 border"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <Button className="flex-1 web3-button">Search</Button>
                  <Button
                    variant="outline"
                    className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Properties Section */}
      <section className="py-16 bg-muted/30" id="properties">
        <div className="container">
          <motion.div
            className="flex justify-between items-center mb-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div>
              <Badge className="mb-2">FEATURED LISTINGS</Badge>
              <h2 className="text-3xl font-bold">Trending Properties</h2>
            </div>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList>
                <TabsTrigger id="all_properties" value="all">
                  All
                </TabsTrigger>
                <TabsTrigger value="available">Available</TabsTrigger>
                <TabsTrigger value="rented">Rented</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-blue-500" />
            </div>
          ) : filteredProperties.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              key={activeTab}
              initial="hidden"
              animate="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {filteredProperties.map((property, index) => (
                <motion.div key={property.id} variants={fadeIn}>
                  <PropertyCard {...property} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No properties found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          <motion.div
            className="mt-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link href="#all_properties">
              <Button
                variant="outline"
                size="lg"
                className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
              >
                View All Properties
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Badge className="mb-2">POWERED BY BLOCKCHAIN</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Key Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of property rentals with our decentralized
              platform
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-5 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeIn}
              className="bg-card rounded-lg p-6 text-center border hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Decentralized Listings</h3>
              <p className="text-sm text-muted-foreground">
                Secure and trustless property rentals
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-card rounded-lg p-6 text-center border hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileContract className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart Contract Payments</h3>
              <p className="text-sm text-muted-foreground">
                No intermediaries, direct transactions
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-card rounded-lg p-6 text-center border hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">IPFS-Based Storage</h3>
              <p className="text-sm text-muted-foreground">
                Decentralized image & metadata storage
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-card rounded-lg p-6 text-center border hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">MetaMask Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Easy Web3 wallet integration
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-card rounded-lg p-6 text-center border hover:shadow-md transition-all"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Escrow Security</h3>
              <p className="text-sm text-muted-foreground">
                Safe fund transfers and deposit handling
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Badge className="mb-2">SIMPLE PROCESS</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started with RentChain in just a few simple steps
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeIn} className="relative">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Sign in with MetaMask
              </h3>
              <p className="text-muted-foreground">
                Connect your wallet to access the platform
              </p>
              <div className="hidden lg:block absolute top-8 right-0 w-1/2 h-0.5 bg-primary/20"></div>
            </motion.div>

            <motion.div variants={fadeIn} className="relative">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Browse & List Properties
              </h3>
              <p className="text-muted-foreground">
                Search for rentals or add new listings
              </p>
              <div className="hidden lg:block absolute top-8 right-0 w-1/2 h-0.5 bg-primary/20"></div>
            </motion.div>

            <motion.div variants={fadeIn} className="relative">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Make Secure Transactions
              </h3>
              <p className="text-muted-foreground">
                Rent properties via smart contracts
              </p>
              <div className="hidden lg:block absolute top-8 right-0 w-1/2 h-0.5 bg-primary/20"></div>
            </motion.div>

            <motion.div variants={fadeIn}>
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Manage Rentals Easily
              </h3>
              <p className="text-muted-foreground">
                Track agreements & payments from your dashboard
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link href="/list-property">
              <Button
                variant="outline"
                size="lg"
                className="web3-button bg-[#1972e6] text-white hover:bg-[#1972e6]"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Badge className="mb-2">TESTIMONIALS</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from property owners and tenants who use RentChain
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                variants={fadeIn}
                className="bg-card rounded-lg p-6 border hover:shadow-md transition-all"
              >
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "{testimonial.content}"
                </p>
                <div className="flex">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent fill-accent" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-6 mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <div className="flex items-center bg-card rounded-lg px-4 py-2 border">
              <Image
                src="/images/ethereum.png"
                alt="Ethereum"
                width={30}
                height={30}
                className="mr-2"
              />
              <span className="text-sm font-medium">Powered by Ethereum</span>
            </div>
            <div className="flex items-center bg-card rounded-lg px-4 py-2 border">
              <Image
                src="/images/ipfs.png"
                alt="IPFS"
                width={30}
                height={30}
                className="mr-2"
              />
              <span className="text-sm font-medium">IPFS Storage</span>
            </div>
            <div className="flex items-center bg-card rounded-lg px-4 py-2 border">
              <Image
                src="/images/metamask.png"
                alt="MetaMask"
                width={30}
                height={30}
                className="mr-2"
              />
              <span className="text-sm font-medium">MetaMask Compatible</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Badge className="mb-2">QUESTIONS</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about RentChain
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
              Ready to Transform Your Property Rental Experience?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of property owners and tenants using blockchain
              technology for secure, transparent rentals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="#properties">
                <Button size="lg" className="web3-button">
                  Explore Properties
                </Button>
              </Link>
              <Link href="/list-property">
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
                >
                  List Your Property
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
