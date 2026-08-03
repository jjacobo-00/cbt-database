"use client"

import { useState } from "react"
import { addOrgNode, updateOrgNode, deleteOrgNode } from "@/app/actions/org-chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Trash2, UserCircle2, Network } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils/utils"

type OrgNode = {
  id: string
  role_title: string
  member_id: string | null
  parent_id: string | null
  sort_order: number | null
}

type Member = {
  id: string
  first_name: string
  last_name: string
}

export function OrgChartClient({ initialNodes, members }: { initialNodes: OrgNode[], members: Member[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [roleTitle, setRoleTitle] = useState("")
  const [memberId, setMemberId] = useState<string>("unassigned")
  const [parentId, setParentId] = useState<string>("root")

  const handleOpenDialog = (node?: OrgNode) => {
    if (node) {
      setEditingNode(node)
      setRoleTitle(node.role_title)
      setMemberId(node.member_id || "unassigned")
      setParentId(node.parent_id || "root")
    } else {
      setEditingNode(null)
      setRoleTitle("")
      setMemberId("unassigned")
      setParentId("root")
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!roleTitle.trim()) {
      toast.error("Role title is required")
      return
    }

    setIsLoading(true)
    const mId = memberId === "unassigned" ? null : memberId
    const pId = parentId === "root" ? null : parentId

    if (editingNode) {
      const res = await updateOrgNode(editingNode.id, { role_title: roleTitle, member_id: mId, parent_id: pId })
      if (res.success) {
        toast.success("Node updated")
        setIsDialogOpen(false)
      } else {
        toast.error("Failed to update: " + res.error)
      }
    } else {
      const res = await addOrgNode({ role_title: roleTitle, member_id: mId, parent_id: pId })
      if (res.success) {
        toast.success("Role added to org chart")
        setIsDialogOpen(false)
      } else {
        toast.error("Failed to add: " + res.error)
      }
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role? Anyone reporting to this role will be moved to the top level.")) return
    
    setIsLoading(true)
    const res = await deleteOrgNode(id)
    if (res.success) {
      toast.success("Role deleted")
    } else {
      toast.error("Failed to delete: " + res.error)
    }
    setIsLoading(false)
  }

  // Build Tree
  const buildTree = (nodes: OrgNode[], parentId: string | null = null): OrgNode[] => {
    return nodes
      .filter((n) => n.parent_id === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  const renderNode = (node: OrgNode, level: number = 0) => {
    const children = buildTree(initialNodes, node.id)
    const assignedMember = members.find((m) => m.id === node.member_id)
    const isRoot = level === 0

    return (
      <div key={node.id} className="relative">
        <div className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 mb-3 border rounded-xl bg-card shadow-sm transition-all hover:border-primary/40 group",
          isRoot ? "border-primary/50 shadow-md bg-gradient-to-r from-primary/5 to-transparent" : "ml-2 sm:ml-8"
        )}>
          {/* Vertical connecting line from parent if not root */}
          {!isRoot && (
            <div className="absolute -left-2 sm:-left-8 top-8 w-2 sm:w-8 h-[2px] bg-border" />
          )}

          <div className="flex items-center gap-3 sm:gap-4 w-full">
            <div className={cn(
              "p-2.5 sm:p-3 rounded-full shrink-0 flex items-center justify-center",
              isRoot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {assignedMember ? (
                <div className="font-bold text-base sm:text-lg leading-none tracking-tight">
                  {assignedMember.first_name[0]}{assignedMember.last_name[0]}
                </div>
              ) : (
                <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-lg truncate">{node.role_title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {assignedMember ? `${assignedMember.first_name} ${assignedMember.last_name}` : "Unassigned"}
              </p>
            </div>

            <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(node)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(node.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Children Container */}
        {children.length > 0 && (
          <div className="relative">
            {/* Vertical spine line for children */}
            <div className="absolute left-4 sm:left-10 top-0 bottom-6 w-[2px] bg-border" />
            <div className="pl-3 sm:pl-10">
              {children.map((child) => renderNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const rootNodes = buildTree(initialNodes, null)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => handleOpenDialog()} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      {initialNodes.length === 0 ? (
        <div className="text-center p-12 border rounded-xl border-dashed bg-muted/30">
          <Network className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No roles defined</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
            Start building your organizational chart by adding the top-level roles first (e.g., Main Pastor).
          </p>
          <Button onClick={() => handleOpenDialog()} className="mt-6">
            Add First Role
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 touch-contain">
          <div className="min-w-[320px] sm:min-w-[500px] py-4">
            {rootNodes.map((node) => renderNode(node, 0))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNode ? "Edit Role" : "Add New Role"}</DialogTitle>
            <DialogDescription>
              Define the title, position in the hierarchy, and assign a member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Title / Position</Label>
              <Input 
                placeholder="e.g. Main Pastor, Secretary..." 
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Member (Optional)</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Unassigned / Vacant --</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.first_name} {m.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reports To</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager/parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">-- Top Level (No Manager) --</SelectItem>
                  {initialNodes.filter(n => n.id !== editingNode?.id).map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.role_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
