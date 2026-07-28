"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, MapPin, User, Calendar, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { createMission, updateMission, deleteMission } from "./actions"

type Mission = {
  id: string
  name: string
  location: string | null
  pastor_name: string | null
  established_date: string | null
}

export function MissionsClient({ 
  initialMissions, 
  members 
}: { 
  initialMissions: Mission[]
  members: { id: string, first_name: string, last_name: string }[]
}) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<{ id?: string, name: string, location: string, pastor_name: string, established_date: string }>({
    name: "",
    location: "",
    pastor_name: "",
    established_date: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredMissions = missions.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.location && m.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.pastor_name && m.pastor_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const openAddModal = () => {
    setFormData({ name: "", location: "", pastor_name: "", established_date: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (mission: Mission) => {
    setFormData({
      id: mission.id,
      name: mission.name,
      location: mission.location || "",
      pastor_name: mission.pastor_name || "",
      established_date: mission.established_date || ""
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (formData.id) {
        const res = await updateMission(formData.id, formData)
        if (res.success && res.data) {
          setMissions(missions.map(m => m.id === formData.id ? res.data as Mission : m))
          toast.success("Mission updated successfully")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Failed to update mission")
        }
      } else {
        const res = await createMission(formData)
        if (res.success && res.data) {
          setMissions([...missions, res.data as Mission].sort((a, b) => a.name.localeCompare(b.name)))
          toast.success("Mission added successfully")
          setIsModalOpen(false)
        } else {
          toast.error(res.error || "Failed to add mission")
        }
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isDeletingId) return
    
    const res = await deleteMission(isDeletingId)
    if (res.success) {
      setMissions(missions.filter(m => m.id !== isDeletingId))
      toast.success("Mission deleted successfully")
    } else {
      toast.error(res.error || "Failed to delete mission")
    }
    setIsDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Input 
          placeholder="Search missions..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md bg-card"
        />
        <Button onClick={openAddModal} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Mission
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMissions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground bg-card border border-dashed rounded-xl shadow-sm">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No missions found</h3>
            <p className="text-sm max-w-sm">There are no mission churches matching your criteria. Try adjusting your search or add a new mission.</p>
          </div>
        ) : (
          filteredMissions.map(mission => (
            <Card key={mission.id} className="relative group overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
              <CardHeader className="pb-3 pr-10">
                <CardTitle className="text-xl line-clamp-1">{mission.name}</CardTitle>
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(mission)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsDeletingId(mission.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{mission.location || "No location specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{mission.pastor_name || "No designated pastor"}</span>
                </div>
                {mission.established_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Established {new Date(mission.established_date).getFullYear()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit Mission' : 'Add New Mission'}</DialogTitle>
            <DialogDescription>
              {formData.id ? 'Update the details for this mission church.' : 'Enter the details for the new mission church.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Mission Name <span className="text-destructive">*</span></Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. CBT Olongapo - Annex" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location / Address</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Subic, Zambales" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pastor_name">Designated Pastor</Label>
              <Input id="pastor_name" list="members-list" value={formData.pastor_name} onChange={(e) => setFormData({...formData, pastor_name: e.target.value})} placeholder="e.g. Ptr. John Doe" />
              <datalist id="members-list">
                {members.map(member => (
                  <option key={member.id} value={`${member.first_name} ${member.last_name}`} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">Select an existing member or type a new name.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="established_date">Established Date</Label>
              <Input id="established_date" type="date" value={formData.established_date} onChange={(e) => setFormData({...formData, established_date: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!isDeletingId} onOpenChange={(open) => !open && setIsDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this mission record from the database.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
