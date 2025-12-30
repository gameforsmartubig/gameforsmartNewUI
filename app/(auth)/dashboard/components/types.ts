import type { CategoryIconName } from "./quiz-icons";


export type Category = {
  id: string;
  title: string;
  icon: CategoryIconName;
};

export type Quiz = {
  title: string;
  creator: string;
  creatorPicture: string;
  categoryId: string;
  questions: number;
  language: string;
  played: number;
  createdAt: string;
};
