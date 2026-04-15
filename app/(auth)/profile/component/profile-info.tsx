"use client"

import { AddressInfo, PersonalInfo } from "@/app/service/profile/profile.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileInfo({ personal, address, onEdit  }: {personal: PersonalInfo, address: AddressInfo, onEdit: () => void}) {

  return (
    <Card className="flex-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Personal Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your profile details and public identity.
          </p>
        </div>
        <div>
          <Button variant="outline" onClick={onEdit}>Edit</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* PERSONAL INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div>
            <p className="text-xs text-muted-foreground">NICKNAME</p>
            <p className="font-medium">{personal.nickname !== "" ? personal.nickname : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">FULL NAME</p>
            <p className="font-medium">{personal.fullName !== "" ? personal.fullName : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">USERNAME</p>
            <p className="font-medium">{personal.username !== "" ? personal.username : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">EMAIL ADDRESS</p>
            <p className="font-medium">{personal.email !== "" ? personal.email : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">DATE OF BIRTH</p>
            <p className="font-medium">{personal.birthDate !== "" ? personal.birthDate : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              ORGANIZATION/INSTITUTION
            </p>
            <p className="font-medium">{personal.grade !== "" ? personal.grade : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">PHONE NUMBER</p>
            <p className="font-medium">{personal.phone !== "" ? personal.phone : "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">GENDER</p>
            <p className="font-medium">{personal.gender !== "" ? personal.gender : "-"}</p>
          </div>
        </div>

        {/* ADDRESS */}
        <div>

          <h3 className="font-semibold mb-4">Address Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted rounded-lg p-6">

            <div>
              <p className="text-xs text-muted-foreground">COUNTRY</p>
              <p className="font-medium">{address.country}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                PROVINCE / STATE
              </p>
              <p className="font-medium">{address.state}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">CITY</p>
              <p className="font-medium">{address.city}</p>
            </div>

          </div>

        </div>

      </CardContent>
    </Card>
  )
}