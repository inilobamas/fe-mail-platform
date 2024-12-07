'use client'

import { useState } from "react"
import { Minus, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import FooterAdminNav from "@/components/FooterAdminNav"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/stores/useAuthStore"
import axios from 'axios'
import withAuth from "@/components/hoc/withAuth";
import DomainSelector from "@/components/DomainSelector"
import LoadingProcessingPage from "@/components/ProcessLoading"

const CreateBulkEmail: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState("mailria.com")
  const [count, setCount] = useState(2)
  const [password, setPassword] = useState("")
  const [baseName, setBaseName] = useState("")
  const { toast } = useToast()
  const token = useAuthStore((state) => state.token)
  const [receiveEmail, setReceiveEmail] = useState("")
  const [isRandom, setIsRandom] = useState(false)
  const [isPasswordRandom, setIsPasswordRandom] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const updateCount = (newCount: number) => {
    if (newCount >= 1 && newCount <= 100) {
      setCount(newCount)
    }
  }

  const generateRandomNames = () => {
    setIsRandom(true)
  }

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let randomPassword = ""
    for (let i = 0; i < 8; i++) {
      randomPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(randomPassword)
    setIsPasswordRandom(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast({
        description: "Please provide a password.",
        variant: "destructive",
      })
      return
    }
    if (count < 2 || count > 100) {
      toast({
        description: "Quantity must be between 2 and 100. Please try again.",
        variant: "destructive",
      })
      return
    }
    if (password.length < 6) {
      toast({
        description: "Password must be at least 6 characters long. Please try again.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/bulk`,
        {
          base_name: baseName || "random",
          quantity: count,
          password: password,
          send_to: receiveEmail,
          domain: selectedDomain
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      toast({
        description: `Successfully created ${count} accounts.`,
        className: "bg-green-500 text-white border-0",
      })
      // Reset the form
      setBaseName("")
      setPassword("")
      setReceiveEmail("")
      setIsRandom(false)
      setIsPasswordRandom(false)
    } catch (error) {
      let errorMessage = "Failed to create users. Please try again."
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast({
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-4 border-b flex items-center justify-between">
          <Toaster />
        </div>

        <div className="max-w-md mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-[180px] h-12 font-bold bg-[#ffeeac] hover:bg-yellow-300 text-black"
                  onClick={generateRandomNames}
                >
                  Random Name
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 mt-auto mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 w-12 rounded-none "
                    onClick={() => updateCount(count - 1)}
                    disabled={count <= 2}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="text"
                    value={count}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) { // Allow only digits
                        const numericValue = parseInt(value, 10);
                        if (numericValue < 101) {
                          setCount(numericValue);
                        } else if (value === "") {
                          setCount(0); // Allow clearing the input
                        }
                      }
                    }}
                    className="w-full h-12 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-12 rounded-none"
                    onClick={() => updateCount(count + 1)}
                    disabled={count >= 100}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-center text-xs text-red-500">
                  Minimum 2, max 100
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={isRandom ? "random" : baseName}
                placeholder="Email (numeric)"
                className={isRandom ? "flex-1 h-12 bg-gray-300" : "flex-1 h-12"}
                onChange={(e) => {
                  const value = e.target.value;
                  setBaseName(value.replace(/\s/g, '')); // Remove spaces
                }}
                disabled={isRandom}
              />
              <span className="text-lg">@</span>
              <DomainSelector
                value={selectedDomain}
                onChange={(value) => setSelectedDomain(value)}
                className="w-[180px]"
              />
            </div>

            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value.replace(/\s/g, '')); // Remove spaces
                }}
                placeholder="Password"
                className={isPasswordRandom ? "flex-1 h-12 bg-gray-300" : "flex-1 h-12"}
                disabled={isPasswordRandom}
              />
              <Button
                type="button"
                onClick={generateRandomPassword}
                className="w-[180px] h-12 font-bold bg-[#ffeeac] hover:bg-yellow-300 text-black"
              >
                Random Password
              </Button>
            </div>

            <Input
              type="email"
              value={receiveEmail}
              onChange={(e) => {
                const value = e.target.value;
                setReceiveEmail(value.replace(/\s/g, '')); // Remove spaces
              }}
              placeholder="Email for receiving list"
              className="h-12"
            />

            <div className="flex justify-center">
              <Button
                type="submit"
                className={`h-12 w-full max-w-xs font-bold text-black ${!receiveEmail || !password
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#ffeeac] hover:bg-yellow-300"
                  }`}
                disabled={!receiveEmail || !password}
              >
                Create
              </Button>
            </div>
          </form>
        </div>
      </div>
      {isLoading && (
        <LoadingProcessingPage />
      )}
      <FooterAdminNav />
    </div>
  )
}

export default withAuth(CreateBulkEmail)