"use client"

import React, { useState, useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { removeWhitelistedUser } from "@/app/(dashboard)/users/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type WhitelistedUser = {
  id: string
  email: string
  name: string | null
  created_at: string | Date | null
}

export function UserListClient({ users }: { users: WhitelistedUser[] }) {
  const [deletingUser, setDeletingUser] = useState<WhitelistedUser | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirmDelete = () => {
    if (!deletingUser) return
    startTransition(async () => {
      await removeWhitelistedUser(deletingUser.id)
      setDeletingUser(null)
    })
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Email Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No users whitelisted yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setDeletingUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Touch Card List View */}
      <div className="flex flex-col md:hidden gap-3 mt-3">
        {users.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground border rounded-xl bg-card text-sm">
            No users whitelisted yet.
          </div>
        ) : (
          users.map((user) => {
            const initial = (user.name || user.email || "U").charAt(0).toUpperCase()
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-xs gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {initial}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-foreground text-sm truncate">
                      {user.name || "Whitelisted User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Added: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => setDeletingUser(user)} 
                  className="h-9 w-9 p-0 shrink-0 min-h-[44px] min-w-[44px]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong className="text-foreground">{deletingUser?.email}</strong> from the whitelisted users list? They will no longer be able to log in to the admin portal via Google OAuth.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revoking...
                </>
              ) : (
                "Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
