"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

export function EditProfile({ data, onCancel }: any) {
  const { personal } = data;
  const { address } = data;

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="relative w-fit mx-auto">
          <Avatar className="w-24 h-24">
            <AvatarImage src={data.profile.avatar} alt={personal.fullName} />
            <AvatarFallback className="rounded-lg">
              {personal.fullName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm cursor-pointer">
            <Camera/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label>Full Name</Label>
            <Input value={personal.fullName} />
          </div>

          <div>
            <Label>Nickname</Label>
            <Input value={personal.nickname} />
          </div>

          <div>
            <Label>Username</Label>
            <Input value={personal.username} />
          </div>

          <div>
            <Label>Email</Label>
            <Input disabled value={personal.email} />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input type="text" value={personal.phone} />
          </div>

          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={personal.birthDate} />
          </div>
          <div>
            <Label>Grade</Label>
            <Select value={personal.grade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={personal.grade} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Elementary School">Elementary School</SelectItem>
                <SelectItem value="Junior High School">Junior High School</SelectItem>
                <SelectItem value="Senior High School">Senior High School</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Organization/Institution</Label>
            <Input value={personal.organization} />
          </div>

          <div>
            <Label>Gender</Label>
            <Input value={personal.gender} />
          </div>

          <div>
            <Label>Country</Label>
            <Input value={address.country} />
          </div>

          <div>
            <Label>State</Label>
            <Input value={address.state} />
          </div>

          <div>
            <Label>City</Label>
            <Input value={address.city} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <Button>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}
