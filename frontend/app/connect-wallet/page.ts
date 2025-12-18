"use client"

import { Badge } from "@/components/ui/badge"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useWeb3 } from "@/components/web3-provider"

export default function ConnectWallet() {
  const router = useRouter()
  const { isConnected, connectWallet, account, isLoading } = useWeb3()
  const [networkName, setNetworkName] = useState<string>("")
  const [networkError, setNetworkError] = useState<boolean>(false)

  useEffect(() => {
    // Check if already connected and redirect
    if (isConnected && account) {
      checkNetwork()
    }
  }, [isConnected, account])

  const checkNetwork = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })

        // Map chain IDs to network names
        const networks: Record<string, string> = {
          "0x1": "Ethereum Mainnet",
          "0x3": "Ropsten Testnet",
          "0x4": "Rinkeby Testnet",
          "0x5": "Goerli Testnet",
          "0x2a": "Kovan Testnet",
          "0x89": "Polygon Mainnet",
          "0x13881": "Polygon Mumbai Testnet",
        }

        setNetworkName(networks[chainId] || `Chain ID: ${chainId}`)

        // For this example, let's say we only support Ethereum Mainnet and Goerli
        const supportedChains = ["0x1", "0x5", "0x89"]
        setNetworkError(!supportedChains.includes(chainId))
      } catch (error) {
        console.error("Error checking network:", error)
      }
    }
  }

  const handleConnect = async () => {
    await connectWallet()
    checkNetwork()
  }

  const handleSwitchNetwork = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        // Request to switch to Ethereum Mainnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }], // Ethereum Mainnet
        })

        checkNetwork()
      } catch (error) {
        console.error("Error switching network:", error)
      }
    }
  }

  return (
    <div className="container py-12 max-w-md mx-auto">
      <Card className="w-full border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">Connect Your Wallet</CardTitle>
          <CardDescription>Connect your wallet to access the RentChain platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected && account ? (
            <>
              <div className="flex items-center justify-center p-6 bg-muted rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg mb-1 wallet-connected">Wallet Connected</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {networkName}
                  </Badge>
                </div>
              </div>

              {networkError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Unsupported Network</AlertTitle>
                  <AlertDescription>Please switch to Ethereum Mainnet or Polygon to use RentChain.</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
              <Wallet className="h-12 w-12 mb-4 text-primary" />
              <h3 className="font-medium text-lg mb-2">No Wallet Connected</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Connect your wallet to access all features of the RentChain platform.
              </p>
              <Button onClick={handleConnect} className="w-full web3-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect MetaMask"
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            <p>By connecting your wallet, you agree to our</p>
            <p>
              <a href="/terms" className="underline hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {isConnected && (
            <>
              {networkError ? (
                <Button onClick={handleSwitchNetwork} className="w-full">
                  Switch to Ethereum Mainnet
                </Button>
              ) : (
                <Button onClick={() => router.push("/")} className="w-full web3-button">
                  Continue to Dashboard
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
