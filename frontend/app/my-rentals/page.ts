
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { Key, Loader2, ArrowUpDown, Calendar, ShieldCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useWeb3 } from "@/components/web3-provider"
import { contractAddresses } from "@/lib/config"
import RentalAgreementABI from "@/lib/abi/RentalAgreement.json"
import PropertyListingABI from "@/lib/abi/PropertyListing.json"
import EscrowABI from "@/lib/abi/Escrow.json"
import { toast } from "sonner"

// Define Rental type
type Rental = {
  rentalId: string
  propertyId: string
  title: string // From PropertyListing/IPFS
  location: string // From PropertyListing
  price: string // Monthly rent (ETH formatted)
  owner: string // Landlord address
  rentedFromTimestamp: number
  rentedUntilTimestamp: number
  deposit: string // Deposit amount (ETH formatted)
  nextPaymentTimestamp?: number // Calculated or from contract state
  depositStatus: "Held" | "ReleaseRequested" | "Released" | "Disputed" // Based on Escrow/RentalAgreement state
  ipfsMetadataHash?: string // Property metadata hash
}

export default function MyRentals() {
  const { signer, provider, isConnected, connectWallet, account } = useWeb3()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReleasing, setIsReleasing] = useState(false)
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null)

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
      return null
    }
  }

  // Helper function to format timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A"
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const fetchRentals = async () => {
    if (!signer || !account || !provider) return
    setIsLoading(true)
    try {
      const rentalAgreementContract = new ethers.Contract(
        contractAddresses.rentalAgreement,
        RentalAgreementABI.abi,
        signer
      )
      const propertyListingContract = new ethers.Contract(
        contractAddresses.propertyListing,
        PropertyListingABI.abi,
        provider // Use provider for read-only calls
      )
       const escrowContract = new ethers.Contract(
        contractAddresses.escrow,
        EscrowABI.abi,
        provider // Use provider for read-only calls
      )

      // Assuming getTenantRentals returns an array of rental IDs (BigInts)
      const tenantRentalIdsBigInt = await rentalAgreementContract.getTenantRentals(account)
      const tenantRentalIds = tenantRentalIdsBigInt.map((id: ethers.BigNumberish) => id.toString())

      const rentalsData: Rental[] = []

      for (const rentalId of tenantRentalIds) {
        const rentalDetails = await rentalAgreementContract.getRentalDetails(rentalId)

        // Check if rental is active or details are valid
        if (!rentalDetails || rentalDetails.state === 2 /* Ended */ || rentalDetails.tenant !== account) {
            continue
        }

        const propertyData = await propertyListingContract.getProperty(rentalDetails.propertyId)
        const metadata = await fetchIpfsMetadata(propertyData?.ipfsMetadataHash)
        const depositBalanceWei = await escrowContract.getDepositBalance(rentalId)

        let depositStatus: Rental["depositStatus"] = "Held" // Default
         // Example logic - needs refinement based on actual contract state/events
        if (depositBalanceWei === 0n) {
            depositStatus = "Released"
        } else if (rentalDetails.depositReleaseRequestedByTenant) { // Assuming this state exists
            depositStatus = "ReleaseRequested"
        }
        // Add logic for "Disputed" if applicable

        rentalsData.push({
          rentalId: rentalId,
          propertyId: rentalDetails.propertyId.toString(),
          title: metadata?.title || propertyData?.location || "Property", // Fallback title
          location: propertyData?.location || "Unknown Location",
          price: ethers.formatEther(rentalDetails.monthlyRentAmount),
          owner: rentalDetails.landlord,
          rentedFromTimestamp: Number(rentalDetails.startDate),
          rentedUntilTimestamp: Number(rentalDetails.endDate),
          deposit: ethers.formatEther(rentalDetails.securityDepositAmount),
          nextPaymentTimestamp: Number(rentalDetails.paidUntil) + (30 * 24 * 60 * 60), // Approximate next payment
          depositStatus: depositStatus,
          ipfsMetadataHash: propertyData?.ipfsMetadataHash,
        })
      }

      setRentals(rentalsData)
    } catch (error) {
      console.error("Error fetching rentals:", error)
       toast.error("Failed to fetch rentals", {
          description: error instanceof Error ? error.message : "An unknown error occurred."
      })
    } finally {
      setIsLoading(false)
    }
  }

 useEffect(() => {
    if (isConnected && signer && account && provider) {
      fetchRentals()
    }
     // Reset state if wallet disconnects
     if (!isConnected) {
        setRentals([])
        setIsLoading(false)
     }
  }, [isConnected, signer, account, provider]) // Re-fetch if connection state changes

 const handleReleaseDeposit = async (rental: Rental) => {
    if (!signer || !account) {
      toast.error("Please connect your wallet.")
      return
    }
    if (rental.depositStatus !== "Held") {
        toast.info(`Deposit status is currently: ${rental.depositStatus}. No action needed or possible.`)
        return
    }

    setSelectedRentalId(rental.rentalId)
    setIsReleasing(true)
    const toastId = toast.loading("Requesting deposit release...")

    try {
      const rentalAgreementContract = new ethers.Contract(
        contractAddresses.rentalAgreement,
        RentalAgreementABI.abi,
        signer
      )

      // Tenant requests release
      const tx = await rentalAgreementContract.requestDepositRelease(rental.rentalId)
      toast.info("Waiting for transaction confirmation...", { id: toastId })
      await tx.wait()

      toast.success("Deposit release requested!", {
        id: toastId,
        description: "The landlord needs to approve the release from their side.",
      })

      // Refresh rentals list to update status
      fetchRentals()

    } catch (error: any) {
      console.error("Error requesting deposit release:", error)
      toast.error("Failed to request deposit release", {
        id: toastId,
        description: error?.reason || error?.message || "An unexpected error occurred.",
      })
    } finally {
      setIsReleasing(false)
      setSelectedRentalId(null)
    }
  }

  if (!isConnected && !isLoading) {
    return (
      <div className="container py-12 text-center">
        <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-8">Please connect your wallet to view your rentals.</p>
        <Button onClick={connectWallet}>Connect Wallet</Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold gradient-text">My Rentals</h1>
                <p className="text-muted-foreground mt-2">Manage your rented properties and security deposits</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : rentals.length > 0 ? (
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
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead>Rental Period</TableHead>
                        <TableHead>Deposit (ETH)</TableHead>
                        <TableHead>Deposit Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {rentals.map((rental) => (
                        <TableRow key={rental.rentalId}>
                        <TableCell className="font-medium">
                            <Link href={`/property/${rental.propertyId}`} className="hover:underline">
                                {rental.title}
                            </Link>
                        </TableCell>
                        <TableCell>{rental.location}</TableCell>
                        <TableCell>{rental.price} ETH</TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>
                                    {formatDate(rental.rentedFromTimestamp)} to {formatDate(rental.rentedUntilTimestamp)}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>{rental.deposit} ETH</TableCell>
                        <TableCell>
                            <Badge
                                variant={(
                                    {
                                        Held: "secondary",
                                        ReleaseRequested: "outline",
                                        Released: "default",
                                        Disputed: "destructive",
                                    } as Record<Rental['depositStatus'], BadgeProps["variant"]>
                                )[rental.depositStatus] || "default"}
                            >
                                {rental.depositStatus}
                                {rental.depositStatus === 'ReleaseRequested' && (
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="h-3 w-3 ml-1 cursor-help"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Waiting for landlord approval.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                             </Badge>
                        </TableCell>
                        <TableCell>
                            <Dialog open={selectedRentalId === rental.rentalId && isReleasing} onOpenChange={(open) => !open && setSelectedRentalId(null)}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="web3-button"
                                        onClick={() => setSelectedRentalId(rental.rentalId)}
                                        disabled={isReleasing || rental.depositStatus !== 'Held'}
                                    >
                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                    Request Release
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                    <DialogTitle>Request Security Deposit Release</DialogTitle>
                                    <DialogDescription>
                                        You are about to request the release of your security deposit of {rental.deposit} ETH for {rental.title}.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                    <p className="text-sm text-muted-foreground">
                                        This will notify the landlord. Once they approve, the deposit will be returned to your wallet.
                                        Ensure you have fulfilled all terms of the rental agreement.
                                    </p>
                                    </div>
                                    <DialogFooter>
                                    <Button variant="outline" onClick={() => setSelectedRentalId(null)} disabled={isReleasing}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleReleaseDeposit(rental)}
                                        disabled={isReleasing}
                                    >
                                        {isReleasing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                        ) : (
                                        "Confirm Request"
                                        )}
                                    </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
            ) : (
                <div className="text-center py-12 border rounded-lg">
                    <Key className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h2 className="text-xl font-semibold mb-2">No Active Rentals</h2>
                    <p className="text-muted-foreground mb-6">
                        You don't have any active rental agreements. Browse available properties to find your next home.
                    </p>
                    <Link href="/">
                        <Button className="web3-button">Browse Properties</Button>
                    </Link>
                </div>
            )}
        </div>
    </TooltipProvider>
  )
}
