import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function PublicProfileOther() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="" alt="fullname" />
          <AvatarFallback className="rounded-lg">lalaaa</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xl">fullname</p>
          <p className="text-muted-foreground">@username</p>
        </div>
      </div>
      <Button className="button-orange">
        <UserPlus />
        Add Friend
      </Button>
    </div>
  );
}
