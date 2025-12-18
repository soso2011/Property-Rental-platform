"use client";

import type React from "react";

import { useState, type ReactNode, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useWeb3 } from "@/components/web3-provider";
import PropertyListingABI from "@/lib/abi/PropertyListing.json";
import { contractAddresses } from "@/lib/config";

const amenitiesOptions = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Balcony",
  "Internet",
  "Laundry",
  "Dishwasher",
  "Air Conditioning",
  "Heating",
  "Furnished",
  "Pet Friendly",
  "Wheelchair Accessible",
  "Elevator",
  "Security",
  // Add more amenities as needed
];
export default function ListProperty() {
  const router = useRouter();
  const { signer, isConnected, connectWallet, account } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    securityDeposit: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    availableFrom: "",
    minRentalPeriod: "3",
    amenities: [] as string[],
  });

  const handleAmenitiesChange = (amenity: string) => {
    setFormData((prev) => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(amenity)) {
        return {
          ...prev,
          amenities: currentAmenities.filter((a) => a !== amenity),
        };
      } else {
        return {
          ...prev,
          amenities: [...currentAmenities, amenity],
        };
      }
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    const input = document.getElementById("images") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isConnected || !signer || !account) {
      toast.error("Please connect your wallet first.");
      await connectWallet();
      return;
    }

    if (!selectedImageFile) {
        toast.error("Please upload a property image.");
        return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Listing property...");

    try {
      // 1. Prepare Base Metadata (API route will add imageUrl)
      const baseMetadata = {
        title: formData.title,
        description: formData.description,
        bedrooms: parseInt(formData.bedrooms, 10),
        bathrooms: parseInt(formData.bathrooms, 10),
        area: parseInt(formData.area, 10),
        amenities: formData.amenities,
        // No imageUrl here
      };

      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedImageFile);
      uploadFormData.append("metadata", JSON.stringify(baseMetadata));

      toast.info("Uploading data to IPFS...", { id: toastId });
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const ipfsData = await response.json();

      if (!response.ok || !ipfsData.success || !ipfsData.metadataIpfsHash) {
        throw new Error(ipfsData.error || "Failed to upload image and metadata to IPFS");
      }
      // We need the METADATA hash to store on-chain
      const metadataIpfsHash = ipfsData.metadataIpfsHash;
      toast.info(`IPFS upload successful. Metadata Hash: ${metadataIpfsHash.substring(0, 10)}...`, { id: toastId });

      // 2. Prepare Contract Interaction (unchanged)
      const propertyListingContract = new ethers.Contract(
        contractAddresses.propertyListing,
        PropertyListingABI.abi,
        signer
      );

      const priceInWei = ethers.parseEther(formData.price);
      const depositInWei = ethers.parseEther(formData.securityDeposit);
      const availableFromDate = new Date(formData.availableFrom);
      const availableFromTimestamp = Math.floor(availableFromDate.getTime() / 1000);
      const minRentalPeriodMonths = parseInt(formData.minRentalPeriod, 10);

      // 3. Call the Smart Contract (unchanged)
      toast.info("Sending transaction to the blockchain...", { id: toastId });
      const tx = await propertyListingContract.listProperty(
        formData.location,
        priceInWei,
        depositInWei,
        parseInt(formData.bedrooms, 10),
        parseInt(formData.bathrooms, 10),
        parseInt(formData.area, 10),
        availableFromTimestamp,
        minRentalPeriodMonths,
        metadataIpfsHash // Send the hash of the *metadata* JSON (which now includes imageUrl)
      );

      toast.info("Waiting for transaction confirmation...", { id: toastId });
      await tx.wait();

      toast.success("Property listed successfully!", {
        id: toastId,
        description: `Transaction Hash: ${tx.hash.substring(0, 10)}...`,
      });

      // Redirect after a short delay
      setTimeout(() => router.push("/my-properties"), 2000);

    } catch (error: any) {
      console.error("Error listing property:", error);
      toast.error("Failed to list property", {
        id: toastId,
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 gradient-text">
          List Your Property
        </h1>

        <Card className="bg-card border">
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              Fill in the details about your property to list it on the
              marketplace.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary">
                  Basic Information
                </h3>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Property Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Modern Apartment in Downtown"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your property..."
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g. New York, NY"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary">
                  Property Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Monthly Rent (ETH)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 0.5"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="area">Area (m²)</Label>
                    <Input
                      id="area"
                      name="area"
                      type="number"
                      min="1"
                      placeholder="e.g. 85"
                      value={formData.area}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Select
                      value={formData.bedrooms}
                      onValueChange={(value) =>
                        handleSelectChange("bedrooms", value)
                      }
                    >
                      <SelectTrigger id="bedrooms" className="border">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5+">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Select
                      value={formData.bathrooms}
                      onValueChange={(value) =>
                        handleSelectChange("bathrooms", value)
                      }
                    >
                      <SelectTrigger id="bathrooms" className="border">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5+">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="availableFrom">Available From</Label>
                    <Input
                      id="availableFrom"
                      name="availableFrom"
                      type="date"
                      value={formData.availableFrom}
                      onChange={handleChange}
                      required
                      className="border"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="minRentalPeriod">
                      Minimum Rental Period (months)
                    </Label>
                    <Select
                      value={formData.minRentalPeriod}
                      onValueChange={(value) =>
                        handleSelectChange("minRentalPeriod", value)
                      }
                    >
                      <SelectTrigger id="minRentalPeriod" className="border">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 month</SelectItem>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Property Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary">
                  Property Images
                </h3>

                <div className="grid gap-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground hover:border-primary transition-colors">
                      {imagePreviewUrl ? (
                        <>
                          <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            className="object-cover w-full h-full rounded-md"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-destructive/80 text-destructive-foreground rounded-full p-1 hover:bg-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8" />
                          <Input
                            id="images"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload at least one image of your property.
                  </p>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-secondary">
                  Amenities
                </h3>
                <div className="gap-2 w-[50%] flex flex-wrap">
                  {formData.amenities.map((selectedAmenity) => (
                    <div
                      key={selectedAmenity}
                      className="flex items-center bg-gray-100 px-2 py-1 rounded-md border border-gray-200"
                    >
                      <span>{selectedAmenity}</span>
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAmenitiesChange(selectedAmenity);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Select
                    onValueChange={handleAmenitiesChange}
                    value=""
                    name="amenities"
                  >
                    <SelectTrigger
                      className="py-2 px-3 rounded-md border border-gray-300"
                      autoCapitalize="words"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amenitiesOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add Security Deposit Field */}
              <div className="grid gap-2">
                <Label htmlFor="securityDeposit">Security Deposit (ETH)</Label>
                <Input
                  id="securityDeposit"
                  name="securityDeposit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 1.0"
                  value={formData.securityDeposit}
                  onChange={handleChange}
                  required
                  className="border"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="web3-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "List Property"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
