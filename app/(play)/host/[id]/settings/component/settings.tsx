import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const quizOptions = [
  {
    quizname: "Pembelajaran menyenangkan",
    question: "50",
    duration: "Duration",
    code: "658347",
    status: "waiting"
  }
];

export function Settings() {
  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      {quizOptions.map((quizOption) => (
        <Card className="mx-auto w-4xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight lg:text-2xl">Settings</CardTitle>
            <CardDescription>{quizOption.quizname}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className=" flex gap-4">
              <div className="space-y-2 flex-1 w-full">
                <Label>Quiz Duration</Label>
                <Select defaultValue="10">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="20">20 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="40">40 seconds</SelectItem>
                    <SelectItem value="50">50 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Quiz Duration</Label>
                <Select defaultValue="10">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="20">20 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="40">40 seconds</SelectItem>
                    <SelectItem value="50">50 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
                <Label>Mode</Label>
                
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
