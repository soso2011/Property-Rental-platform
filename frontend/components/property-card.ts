import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Bed, Bath, Square } from "lucide-react"

interface PropertyCardProps {
  id: string
  title: string
  location: string
  price: number
  image: string
  bedrooms: number
  bathrooms: number
  area: number
  isAvailable: boolean
  showRentButton?: boolean
}

export default function PropertyCard({
  id,
  title,
  location,
  price,
  image,
  bedrooms,
  bathrooms,
  area,
  isAvailable,
  showRentButton = true,
}: PropertyCardProps) {
  return (
    <Card className="overflow-hidden transition-all web3-card border">
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={image || "/images/property_1.jpg"}
          alt={title}
          fill
          className="object-cover transition-transform hover:scale-105"
        />
        <Badge variant={isAvailable ? "default" : "secondary"} className="absolute top-2 right-2">
          {isAvailable ? "Available" : "Rented"}
        </Badge>
      </div>

      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{title}</h3>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{price} ETH</div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="flex justify-between text-sm">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span>
              {bedrooms} {bedrooms === 1 ? "Bed" : "Beds"}
            </span>
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            <span>
              {bathrooms} {bathrooms === 1 ? "Bath" : "Baths"}
            </span>
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span>{area} m²</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {showRentButton && (
          <Link href={`/property/${id}`} className="w-full">
            <Button
              className="w-full web3-button"
              variant={isAvailable ? "default" : "secondary"}
              disabled={!isAvailable}
            >
              {isAvailable ? "Rent Now" : "Not Available"}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
