"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronDown, UserPlus, Users, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { addWhitelistedUser } from "@/app/(dashboard)/users/actions"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils/errors"

export function AddUserClient({ members }: { members: any[] }) {
  const [mode, setMode] = useState<"member" | "manual">("member")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form fields
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("name", name)
      
      await addWhitelistedUser(formData)
      toast.success("User added to whitelist successfully!")
      
      // Reset form
      setEmail("")
      setName("")
      setSelectedMemberId("")
    } catch (error) {
      console.error("Error adding whitelisted user:", error)
      toast.error(getErrorMessage(error, "Failed to add user."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    const m = members.find(m => m.id === memberId)
    if (m) {
      const fullName = `${m.first_name} ${m.middle_name ? m.middle_name + " " : ""}${m.last_name}${m.suffix ? " " + m.suffix : ""}`
      setName(fullName)
      setEmail(m.email || "")
    }
    setComboboxOpen(false)
  }

  return (
    <div className="bg-muted/30 border rounded-lg p-4 sm:p-6 mb-8 w-full max-w-4xl">
      {/* Mode Toggle */}
      <div className="flex bg-muted p-1 rounded-md mb-6 w-fit">
        <button
          type="button"
          onClick={() => setMode("member")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all",
            mode === "member" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" /> Link Existing Member
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("manual")
            setSelectedMemberId("")
            setName("")
            setEmail("")
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-all",
            mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-4 w-4" /> Manual Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 sm:items-end w-full">
        {mode === "member" ? (
          <div className="grid flex-1 gap-2 w-full max-w-sm">
            <label className="text-sm font-medium leading-none">Select Member</label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className={cn(
                    "justify-between w-full font-normal h-10",
                    !selectedMemberId && "text-muted-foreground"
                  )}
                >
                  {selectedMemberId
                    ? members.find((member) => member.id === selectedMemberId)?.first_name + " " + members.find((member) => member.id === selectedMemberId)?.last_name
                    : "Search for a member..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] md:w-[384px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search member..." className="h-11" />
                  <CommandList>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      {members.map((m) => (
                        <CommandItem
                          key={m.id}
                          value={`${m.first_name} ${m.last_name}`}
                          onSelect={() => handleSelectMember(m.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-primary",
                              selectedMemberId === m.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {m.first_name} {m.last_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="grid flex-1 gap-2 w-full max-w-sm">
            <label className="text-sm font-medium leading-none" htmlFor="name">Name (Optional)</label>
            <Input 
              type="text" 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe" 
              className="w-full h-10" 
            />
          </div>
        )}

        <div className="grid flex-1 gap-2 w-full max-w-sm">
          <label className="text-sm font-medium leading-none" htmlFor="email">Google Email Address</label>
          <Input 
            required 
            type="email" 
            id="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder={mode === "member" ? "Auto-filled from profile" : "e.g. guest@cbt.org"} 
            className="w-full h-10" 
          />
        </div>
        
        <Button type="submit" className="gap-2 w-full sm:w-auto mt-2 sm:mt-0 h-10" disabled={!email || isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add User
        </Button>
      </form>
    </div>
  )
}
