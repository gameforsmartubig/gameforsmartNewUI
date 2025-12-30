"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  CircleQuestionMark,
  ClockPlus,
  Languages,
  Play,
  PlusIcon,
  Search,
  User,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import type { Category, Quiz } from "./types";
import { categoryIconMap } from "./quiz-icons";

export function SearchQuiz({categories}: {categories: Category[];}) {
  return (
    <div className="flex w-full items-center space-x-2 sm:w-auto">
      <div className="relative w-full sm:w-auto">
        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
        <button className="bg-primary text-primary-foreground hover:bg-primary/90 absolute top-1 right-1 ml-auto flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:cursor-pointer">
          <Search className="h-4 w-4" />
        </button>
        <Input placeholder="Search" className="pl-8" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Category <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {categories.map((category) => {
            const Icon = categoryIconMap[category.icon];
            return (
            <DropdownMenuCheckboxItem key={category.title} className="capitalize" checked={true}>
              <Icon className="mr-2 h-4 w-4"/>
              {category.title}
            </DropdownMenuCheckboxItem>
          );})}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TabsQuiz({ quizzes, categories }: { quizzes: Quiz[]; categories: Category[] }) {
  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, c])
  )
  const [activeTab, setActiveTab] = useState("quiz");
  return (
    <>
      {/* tabs quiz */}
      <div className="flex flex-row items-center justify-between gap-2 sm:flex-row">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
            <TabsTrigger value="myQuiz">My Quiz</TabsTrigger>
            <TabsTrigger value="favorite">Favorite</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-row items-center justify-between gap-2">
          <Button variant="outline" className="">
            <PlusIcon />
            <span className="hidden sm:inline">Create Quiz</span>
            <span className="inline sm:hidden">Create</span>
          </Button>
          <Button variant="outline" className="flex">
            <Play />
            <span className="hidden sm:inline">Join Quiz</span>
            <span className="inline sm:hidden">Join</span>
          </Button>
        </div>
      </div>
      {/* tabs content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="quiz">
          <div className="flex w-full items-center justify-center">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const category = categoryMap[quiz.categoryId];
                const Icon = categoryIconMap[category.icon];
                return(
                <Card key={quiz.title}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-start gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <User size={16} /> {quiz.creator}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockPlus size={16} /> {quiz.createdAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Languages size={16} /> {quiz.language}
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-evenly gap-2 text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <CircleQuestionMark size={32} />
                        <div>{quiz.questions}</div>
                        <div>Pertanyaan</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={32} />
                        <div>{category.title}</div>
                        <div>Kategori</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Play size={32} />
                        <div>{quiz.played}</div>
                        <div>Dimainkan</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Host</Button>
                    <Button variant="outline">Tryout</Button>
                  </CardFooter>
                </Card>
              );})}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="myQuiz">
          <div className="flex w-full items-center justify-center">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const category = categoryMap[quiz.categoryId];
                const Icon = categoryIconMap[category.icon];
                return(
                <Card key={quiz.title}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-start gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <User size={16} /> {quiz.creator}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockPlus size={16} /> {quiz.createdAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Languages size={16} /> {quiz.language}
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-evenly gap-2 text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <CircleQuestionMark size={32} />
                        <div>{quiz.questions}</div>
                        <div>Pertanyaan</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={32} />
                        <div>{category.title}</div>
                        <div>Kategori</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Play size={32} />
                        <div>{quiz.played}</div>
                        <div>Dimainkan</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Host</Button>
                    <Button variant="outline">Tryout</Button>
                  </CardFooter>
                </Card>
              );})}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="favorite">
          <div className="flex w-full items-center justify-center">
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const category = categoryMap[quiz.categoryId];
                const Icon = categoryIconMap[category.icon];
                return(
                <Card key={quiz.title}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-start gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <User size={16} /> {quiz.creator}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockPlus size={16} /> {quiz.createdAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Languages size={16} /> {quiz.language}
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-evenly gap-2 text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <CircleQuestionMark size={32} />
                        <div>{quiz.questions}</div>
                        <div>Pertanyaan</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={32} />
                        <div>{category.title}</div>
                        <div>Kategori</div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Play size={32} />
                        <div>{quiz.played}</div>
                        <div>Dimainkan</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline">Host</Button>
                    <Button variant="outline">Tryout</Button>
                  </CardFooter>
                </Card>
              );})}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
