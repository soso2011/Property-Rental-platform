"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { Building2, Plus, Loader2, ArrowUpDown, MoreHorizontal, Edit, Trash, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useWeb3 } from "@/components/web3-provider"
import { contractAddresses } from "@/lib/config"
import PropertyListingABI from "@/lib/abi/PropertyListing.json"
import RentalAgreementABI from "@/lib/abi/RentalAgreement.json"
import EscrowABI from "@/lib/abi/Escrow.json"
import { toast } from "sonner"

// Define Property type based on contract structure and potential IPFS data
type Property = {
  id: string; // propertyId from contract
  title: string; // From IPFS metadata
  location: string; // From contract
  price: string; // From contract (ETH formatted string)
  isAvailable: boolean; // From contract
  renter: string | null; // From contract/RentalAgreement
  rentCollected: string; // From Escrow contract (ETH formatted string)
  rentDue: string | null; // Could be calculated or stored elsewhere
  ipfsMetadataHash: string; // From contract
  imageUrl?: string; // From IPFS metadata (optional)
  area?: number; // From IPFS metadata (optional)
  bedrooms?: number; // From IPFS metadata (optional)
  bathrooms?: number; // From IPFS metadata (optional)
  rentalId?: string | null; // Active rental ID for this property
}

export default function MyProperties() {
  const { signer, provider, isConnected, connectWallet, account } = useWeb3()
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  const fetchIpfsMetadata = async (ipfsHash: string) => {
    if (!ipfsHash || ipfsHash.startsWith('undefined')) {
      console.warn("Invalid IPFS hash provided:", ipfsHash)
      return null // Return null or a default object
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
      return null // Return null on error
    }
  }

  const fetchProperties = async () => {
    if (!signer || !account || !provider) return
    setIsLoading(true)
    try {
      const propertyListingContract = new ethers.Contract(
        contractAddresses.propertyListing,
        PropertyListingABI.abi,
        signer
      )
      const rentalAgreementContract = new ethers.Contract(
        contractAddresses.rentalAgreement,
        RentalAgreementABI.abi,
        signer
      )
      const escrowContract = new ethers.Contract(
        contractAddresses.escrow,
        EscrowABI.abi,
        signer
      )

      const ownerPropertyIdsBigInt = await propertyListingContract.getOwnerProperties(account)
      const ownerPropertyIds = ownerPropertyIdsBigInt.map((id: ethers.BigNumberish) => id.toString())

      const propertiesData: Property[] = []

      for (const propertyId of ownerPropertyIds) {
        const propertyData = await propertyListingContract.getProperty(propertyId)

        if (!propertyData || !propertyData.isListed) continue // Skip if data is invalid or not listed

        const metadata = await fetchIpfsMetadata(propertyData.ipfsMetadataHash)
        const activeRentalIdBigInt = await rentalAgreementContract.getActiveRentalIdForProperty(propertyId)
        const activeRentalId = activeRentalIdBigInt > 0n ? activeRentalIdBigInt.toString() : null

        let rentCollectedWei = 0n
        if (activeRentalId) {
          rentCollectedWei = await escrowContract.getRentBalance(activeRentalId)
        }

        propertiesData.push({
          id: propertyId,
          title: metadata?.title || "Untitled Property",
          location: propertyData.location,
          price: ethers.formatEther(propertyData.pricePerMonth),
          isAvailable: !activeRentalId, // Property is available if no active rental
          renter: null, // TODO: Fetch tenant address if needed
          rentCollected: ethers.formatEther(rentCollectedWei),
          rentDue: null, // TODO: Implement rent due logic if needed
          ipfsMetadataHash: propertyData.ipfsMetadataHash,
          imageUrl: metadata?.imageUrl || "/placeholder.svg", // Assume imageUrl is in metadata
          area: metadata?.area,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          rentalId: activeRentalId,
        })
      }

      setProperties(propertiesData)
    } catch (error) {
      console.error("Error fetching properties:", error)
      toast.error("Failed to fetch properties", {
        description: error instanceof Error ? error.message : "An unknown error occurred."
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && signer && account) {
      fetchProperties()
    }
    // Reset state if wallet disconnects
    if (!isConnected) {
      setProperties([])
      setIsLoading(false)
    }
  }, [isConnected, signer, account]) // Re-fetch if connection state changes

  const handleWithdrawRent = async (property: Property) => {
    if (!signer || !account || !property.rentalId) {
      toast.error("Cannot withdraw rent. Ensure wallet is connected and property is rented.")
      return
    }

    setSelectedPropertyId(property.id)
    setIsWithdrawing(true)
    const toastId = toast.loading("Processing rent withdrawal...")

    try {
      const escrowContract = new ethers.Contract(
        contractAddresses.escrow,
        EscrowABI.abi,
        signer
      )

      // Assuming Escrow contract has a withdrawRent function that takes rentalId
      const tx = await escrowContract.withdrawRent(property.rentalId)

      toast.info("Waiting for transaction confirmation...", { id: toastId })
      await tx.wait()

      toast.success("Rent withdrawn successfully!", {
        id: toastId,
        description: `Transaction Hash: ${tx.hash.substring(0, 10)}...`,
      })

      // Re-fetch properties to update the rentCollected amount
      fetchProperties()

    } catch (error: any) {
      console.error("Error withdrawing rent:", error)
      toast.error("Failed to withdraw rent", {
        id: toastId,
        description: error?.reason || error?.message || "An unexpected error occurred.",
      })
    } finally {
      setIsWithdrawing(false)
      setSelectedPropertyId(null)
    }
  }

  // TODO: Implement handleDeleteProperty using unlistProperty from PropertyListing contract if available
  const handleDeleteProperty = async (propertyId: string) => {
    toast.warning("Delete functionality not yet implemented.")
    // Example logic (needs contract function):
    /*
    if (!signer) return;
    try {
        const propertyListingContract = new ethers.Contract(...);
        const tx = await propertyListingContract.unlistProperty(propertyId);
        await tx.wait();
        toast.success("Property unlisted.");
        fetchProperties(); // Refresh list
    } catch (error) {
        console.error("Error unlisting property:", error);
        toast.error("Failed to unlist property.");
    }
    */
  }

  if (!isConnected && !isLoading) {
    return (
      <div className="container py-12 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-8">Please connect your wallet to view your properties.</p>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">My Properties</h1>
        <Link href="/list-property">
          <Button className="web3-button">
            <Plus className="mr-2 h-4 w-4" />
            List New Property
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <Button variant="ghost" className="p-0 hover:bg-transparent">
                    <span>Property</span>
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price (ETH)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent Collected (ETH)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    <Link href={`/property/${property.id}`} className="hover:underline">
                      {property.title}
                    </Link>
                  </TableCell>
                  <TableCell>{property.location}</TableCell>
                  <TableCell>{property.price} ETH/month</TableCell>
                  <TableCell>
                    <Badge variant={property.isAvailable ? "outline" : "secondary"}>
                      {property.isAvailable ? "Available" : "Rented"}
                    </Badge>
                  </TableCell>
                  <TableCell>{property.rentCollected} ETH</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!property.isAvailable && parseFloat(property.rentCollected) > 0 && (
                        <Dialog open={selectedPropertyId === property.id && isWithdrawing} onOpenChange={(open) => !open && setSelectedPropertyId(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="web3-button"
                              onClick={() => setSelectedPropertyId(property.id)} // Set ID for dialog context
                              disabled={isWithdrawing}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Withdraw
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Withdraw Rent</DialogTitle>
                              <DialogDescription>
                                You are about to withdraw {property.rentCollected} ETH of collected rent for{" "}
                                {property.title}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-muted-foreground">
                                This action will transfer the funds to your connected wallet address ({account?.substring(0, 6)}...{account?.substring(account.length - 4)}).
                              </p>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedPropertyId(null)} disabled={isWithdrawing}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleWithdrawRent(property)}
                                disabled={isWithdrawing}
                              >
                                {isWithdrawing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  "Confirm Withdraw"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Property
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteProperty(property.id)}
                            disabled // Remove disabled when implemented
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Remove Listing
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">No Properties Listed</h2>
          <p className="text-muted-foreground mb-6">
            You haven't listed any properties yet. Start earning by listing your property now.
          </p>
          <Link href="/list-property">
            <Button className="web3-button">
              <Plus className="mr-2 h-4 w-4" />
              List Your First Property
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
