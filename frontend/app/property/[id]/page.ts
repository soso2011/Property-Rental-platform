"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ethers } from "ethers"
import { MapPin, Bed, Bath, Square, Calendar, User, ArrowLeft, Share2, Heart, Loader2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWeb3 } from "@/components/web3-provider"
import { toast } from "sonner"
import { contractAddresses } from "@/lib/config"
import PropertyListingABI from "@/lib/abi/PropertyListing.json"
import RentalAgreementABI from "@/lib/abi/RentalAgreement.json"
import EscrowABI from "@/lib/abi/Escrow.json"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define Property type for detailed view
type DetailedProperty = {
  id: string
  title: string
  description: string
  location: string
  pricePerMonth: string // ETH formatted
  securityDeposit: string // ETH formatted
  images: string[] // Array of IPFS URLs or placeholders
  bedrooms: number
  bathrooms: number
  area: number
  isAvailable: boolean
  owner: string
  amenities: string[]
  availableFromTimestamp: number
  minRentalPeriodMonths: number
  ipfsMetadataHash: string
  // Store Wei values as strings to avoid BigInt serialization issues
  pricePerMonthWei: string
  securityDepositWei: string
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>()
  const { signer, provider, isConnected, connectWallet, account } = useWeb3()
  const [property, setProperty] = useState<DetailedProperty | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [isRenting, setIsRenting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const fetchIpfsMetadata = async (ipfsHash?: string) => {
    if (!ipfsHash || ipfsHash.startsWith('undefined')) {
      console.warn("Invalid or missing IPFS hash provided:", ipfsHash)
      return null
    }
    const gatewayUrl = process.env.NEXT_PUBLIC_IPFS_GATEWAY
    if (!gatewayUrl) {
      console.error("IPFS Gateway URL is not configured.")
      return null
    }
    const url = `${gatewayUrl}/ipfs/${ipfsHash}`
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch IPFS data: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching IPFS metadata (${ipfsHash}):`, error)
      toast.error(`Failed to fetch metadata for hash: ${ipfsHash.substring(0, 10)}...`)
      return null
    }
  }

  // Helper function to format timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!provider || !id) return
      setIsLoading(true)
      try {
        const propertyListingContract = new ethers.Contract(
          contractAddresses.propertyListing,
          PropertyListingABI.abi,
          provider
        )
        const rentalAgreementContract = new ethers.Contract(
          contractAddresses.rentalAgreement,
          RentalAgreementABI.abi,
          provider
        )

        const propertyData = await propertyListingContract.getProperty(id)

        if (!propertyData || propertyData.id === 0n) {
          throw new Error("Property not found")
        }

        const metadata = await fetchIpfsMetadata(propertyData.ipfsMetadataHash)
        const activeRentalIdBigInt = await rentalAgreementContract.getActiveRentalIdForProperty(id)
        const isAvailable = activeRentalIdBigInt === 0n

        // Construct detailed property object
        const detailedProperty: DetailedProperty = {
          id: propertyData.id.toString(),
          title: metadata?.title || "Property Title Missing",
          description: metadata?.description || "No description provided.",
          location: propertyData.location,
          pricePerMonth: ethers.formatEther(propertyData.pricePerMonth),
          securityDeposit: ethers.formatEther(propertyData.securityDeposit),
          images: metadata?.imageUrls || [metadata?.imageUrl || "/placeholder.svg"],
          bedrooms: Number(propertyData.bedrooms),
          bathrooms: Number(propertyData.bathrooms),
          area: Number(propertyData.areaSqMeters),
          isAvailable: isAvailable,
          owner: propertyData.owner,
          amenities: Array.isArray(metadata?.amenities) ? [...metadata.amenities] : [],
          availableFromTimestamp: Number(propertyData.availableFromTimestamp),
          minRentalPeriodMonths: Number(propertyData.minRentalPeriodMonths),
          ipfsMetadataHash: propertyData.ipfsMetadataHash,
          // Convert BigInt to string for state storage
          pricePerMonthWei: propertyData.pricePerMonth.toString(),
          securityDepositWei: propertyData.securityDeposit.toString(),
        }

        // Deep clone before setting state (still useful for other nested objects)
        const plainProperty = JSON.parse(JSON.stringify(detailedProperty));
        setProperty(plainProperty);

      } catch (error) {
        console.error("Error fetching property details:", error)
        toast.error("Failed to fetch property details", {
          description: error instanceof Error && error.message === "Property not found" ? "This property does not exist." : "An error occurred while fetching data."
        })
        setProperty(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [id, provider])

  const handleRentNow = async () => {
    if (!isConnected || !signer || !account) {
      toast.error("Please connect your wallet first.")
      await connectWallet()
      return
    }
    if (!property || !property.isAvailable) {
      toast.error("This property is not available for rent.")
      return
    }

    // Prevent renting own property
    if (property.owner.toLowerCase() === account.toLowerCase()) {
      toast.error("You cannot rent your own property.")
      return
    }

    setIsRenting(true)
    const toastId = toast.loading("Preparing rental transaction...")

    try {
      const rentalAgreementContract = new ethers.Contract(
        contractAddresses.rentalAgreement,
        RentalAgreementABI.abi,
        signer
      )

      // Convert stored string Wei values back to BigInt for calculation
      const priceWei = BigInt(property.pricePerMonthWei);
      const depositWei = BigInt(property.securityDepositWei);
      const totalAmountWei = priceWei + depositWei;

      toast.info("Please confirm the transaction in your wallet...", { id: toastId })

      // Call the rentProperty function with only propertyId and value
      const tx = await rentalAgreementContract.rentProperty(
        property.id,
        {
          value: totalAmountWei,
        }
      )

      toast.info("Waiting for transaction confirmation...", { id: toastId })
      await tx.wait()

      toast.success("Property Rented Successfully!", {
        id: toastId,
        description: `Transaction Hash: ${tx.hash.substring(0, 10)}...`,
      })

      // Update property state to show as rented (or re-fetch)
      setProperty(prev => prev ? { ...prev, isAvailable: false } : null)
    } catch (error: any) {
      console.error("Error renting property:", error)
      toast.error("Failed to rent property", {
        id: toastId,
        description: error?.reason || error?.message || "An unexpected error occurred.",
      })
    } finally {
      setIsRenting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
        <p className="text-muted-foreground mb-8">The property you were looking for could not be found or loaded.</p>
        <Link href="/">
          <Button className="web3-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Property Images */}
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <Image
              src={property.images[activeImage] || "/placeholder.svg"}
              alt={property.title}
              fill
              className="object-cover"
            />
            <Badge variant={property.isAvailable ? "default" : "secondary"} className="absolute top-4 right-4">
              {property.isAvailable ? "Available" : "Rented"}
            </Badge>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {property.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border ${
                  activeImage === index ? "ring-2 ring-primary" : ""
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${property.title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold gradient-text">{property.title}</h1>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{property.location}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
                aria-label="Add to favorites"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#e4ecf8] text-[#3080e8]" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-[#e4ecf8] hover:text-[#3080e8]"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1 text-primary" />
              <span>
                {property.bedrooms} {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
              </span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1 text-primary" />
              <span>
                {property.bathrooms} {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
              </span>
            </div>
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-1 text-primary" />
              <span>{property.area} m²</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-primary" />
              <span>Available from {formatDate(property.availableFromTimestamp)}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1 text-primary" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate cursor-help">
                      Owner: {property.owner.substring(0, 6)}...{property.owner.substring(property.owner.length - 4)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{property.owner}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <Card className="bg-card border">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-primary">{property.pricePerMonth} ETH</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Min. rental period: {property.minRentalPeriodMonths} months
                </div>
              </div>

              <Button
                className="w-full web3-button"
                size="lg"
                disabled={!property.isAvailable || isRenting || !isConnected || property.owner.toLowerCase() === account?.toLowerCase()}
                onClick={handleRentNow}
                title={property.owner.toLowerCase() === account?.toLowerCase() ? "Cannot rent your own property" : ""}
              >
                {isRenting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : property.isAvailable ? (
                  "Rent Now"
                ) : (
                  "Currently Rented"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Security deposit: {property.securityDeposit} ETH (refundable, paid upfront)
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="description">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="amenities"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Amenities
              </TabsTrigger>
              <TabsTrigger value="terms" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                Terms
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4 text-muted-foreground">
              {property.description}
            </TabsContent>
            <TabsContent value="amenities" className="mt-4">
              <ul className="list-disc list-inside grid grid-cols-2 gap-2 text-muted-foreground">
                {property.amenities.map((amenity, index) => (
                  <li key={index}>{amenity}</li>
                ))}
                {property.amenities.length === 0 && <li>No specific amenities listed.</li>}
              </ul>
            </TabsContent>
            <TabsContent value="terms" className="mt-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>• Minimum rental period: {property.minRentalPeriodMonths} months</li>
                <li>• Security deposit: {property.securityDeposit} ETH (refundable, paid upfront)</li>
                <li>• Rent is paid monthly in advance</li>
                <li>• No pets allowed</li>
                <li>• No smoking inside the property</li>
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
