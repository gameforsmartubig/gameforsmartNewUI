import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Hourglass, Trophy } from "lucide-react";

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
    <div className="flex items-center justify-center lg:h-screen">
      {quizOptions.map((quizOption) => (
        <Card className="mx-auto w-4xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight lg:text-2xl">Settings</CardTitle>
            <CardDescription>{quizOption.quizname}</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            <div className=" flex gap-4">
              <div className="space-y-2 flex-1 w-full">
                <Label>Quiz Duration</Label>
                <Select defaultValue="5">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minute</SelectItem>
                    <SelectItem value="10">10 minute</SelectItem>
                    <SelectItem value="15">15 minute</SelectItem>
                    <SelectItem value="20">20 minute</SelectItem>
                    <SelectItem value="25">25 minute</SelectItem>
                    <SelectItem value="30">30 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <Label>Quiz Duration</Label>
                <Select defaultValue="5">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator/>
            <div className="space-y-2">
                <Label>Mode</Label>
                <RadioGroup defaultValue="1" className="flex flex-col gap-2">
                    <div className="flex items-center flex-1 gap-4 border py-2 px-4 rounded-lg">
                        <RadioGroupItem value="1" />
                        <div className="flex flex-col flex-1"> 
                            <p>First Completed</p>
                            <p className="text-xs">Ends when first person finish</p>
                        </div>
                        <Trophy size={16}/>
                    </div>
                    <div className="flex items-center flex-1 gap-4 border py-2 px-4 rounded-lg">
                        <RadioGroupItem value="2" />
                        <div className="flex flex-col flex-1"> 
                            <p>Wait for Time</p>
                            <p className="text-xs">Everyone plays until the time runs out</p>
                        </div>
                        <Hourglass  size={16}/>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex items-center gap-4">
                <Checkbox/>
                <div>
                    <p>Allow late joiners</p>
                    <p className="text-xs">Users can join quiz session even after it has started</p>
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4 ">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
