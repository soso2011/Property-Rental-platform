"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  account: string | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  isLoading: boolean
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  isConnected: false,
  connectWallet: async () => {},
  isLoading: false,
})

export const useWeb3 = () => useContext(Web3Context)

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          if (accounts.length > 0) {
            const signer = await provider.getSigner()
            setProvider(provider)
            setSigner(signer)
            setAccount(accounts[0].address)
            setIsConnected(true)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
        } else {
          setAccount(null)
          setIsConnected(false)
        }
      })
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      setIsLoading(true)
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const accounts = await provider.listAccounts()
        const signer = await provider.getSigner()

        setProvider(provider)
        setSigner(signer)
        setAccount(accounts[0].address)
        setIsConnected(true)
      } catch (error) {
        console.error("Error connecting to wallet:", error)
      } finally {
        setIsLoading(false)
      }
    } else {
      alert("Please install MetaMask to use this feature")
    }
  }

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        isConnected,
        connectWallet,
        isLoading,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
