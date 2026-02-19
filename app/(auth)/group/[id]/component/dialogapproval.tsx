"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell } from "lucide-react";
import { useState } from "react";

export default function DialogApproval() {
    const [open, setOpen] = useState(false)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative rounded-xl">
                  <Bell size={16} />
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approval</DialogTitle>
                </DialogHeader>
                <div>
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}