"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import { supabase } from "@/lib/supabase";
import { supabaseRealtime, isRealtimeDbConfigured } from "@/lib/supabase-realtime";
import { toast } from "sonner";

// Helper function to update realtime session
const updateGameSessionRT = async (sessionId: string, updates: any) => {
  if (!supabaseRealtime) return false;
  const { error } = await supabaseRealtime
    .from("game_sessions_rt")
    .update(updates)
    .eq("id", sessionId);
  if (error) {
    console.error("Realtime update error:", error);
    return false;
  }
  return true;
};

// Helper function to delete realtime session
const deleteGameSessionRT = async (sessionId: string) => {
  if (!supabaseRealtime) return false;
  const { error } = await supabaseRealtime.from("game_sessions_rt").delete().eq("id", sessionId);
  if (error) {
    console.error("Realtime delete error:", error);
    return false;
  }
  return true;
};

export function Settings({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [gameSession, setGameSession] = useState<any>(null);

  // Initial State Values
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<string>("5");
  const [gameEndMode, setGameEndMode] = useState<string>("first_finish");
  const [allowJoinAfterStart, setAllowJoinAfterStart] = useState<boolean>(false);
  const [questionLimit, setQuestionLimit] = useState<string>("5");

  const fetchSessionData = useCallback(async () => {
    try {
      const { data: sessionData, error } = await supabase
        .from("game_sessions")
        .select(
          `
          *,
          quizzes!inner(
            id,
            title,
            questions
          )
        `
        )
        .eq("id", sessionId)
        .single();

      if (error || !sessionData) {
        toast.error("Session tidak ditemukan");
        router.push("/dashboard");
        return;
      }

      setGameSession(sessionData);
      setQuizData(sessionData.quizzes);

      // Initialize State
      setTotalTimeMinutes(sessionData.total_time_minutes?.toString() || "5");
      setGameEndMode(sessionData.game_end_mode || "first_finish");
      setAllowJoinAfterStart(sessionData.allow_join_after_start || false);

      // Initialize Question Limit logic
      const currentLimit = sessionData.question_limit || "5";
      const totalQuestions = sessionData.quizzes.questions?.length || 0;

      if (totalQuestions >= parseInt(currentLimit)) {
        setQuestionLimit(currentLimit);
      } else {
        setQuestionLimit(totalQuestions.toString());
      }

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data");
      router.push("/dashboard");
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const handleCancel = async () => {
    if (from === "room") {
      setShowExitDialog(true);
      return;
    }

    // Default flow (e.g. creating new session): Delete and go back to dashboard
    try {
      // Delete from Main DB
      await supabase.from("game_sessions").delete().eq("id", sessionId);
      // Delete from Realtime DB
      await deleteGameSessionRT(sessionId);
      toast.success("Session cancelled");
    } catch (err) {
      console.error(err);
    } finally {
      router.push("/dashboard");
    }
  };

  const handleLeaveSession = async () => {
    try {
      // Delete from Main DB
      await supabase.from("game_sessions").delete().eq("id", sessionId);
      // Delete from Realtime DB
      await deleteGameSessionRT(sessionId);
      toast.success("Session deleted");
    } catch (err) {
      console.error("Error deleting session:", err);
      toast.error("Failed to delete session");
    } finally {
      router.push("/dashboard");
    }
  };

  const handleSave = async () => {
    if (!quizData || !gameSession) return;
    setIsSaving(true);

    try {
      const updateData = {
        total_time_minutes: parseInt(totalTimeMinutes),
        game_end_mode: gameEndMode,
        allow_join_after_start: allowJoinAfterStart,
        question_limit: questionLimit
      };

      // 1. Update Main DB
      const { error: mainError } = await supabase
        .from("game_sessions")
        .update(updateData)
        .eq("id", sessionId);

      if (mainError) throw mainError;

      // 2. Update Realtime DB
      await updateGameSessionRT(sessionId, updateData);

      // 3. Select Questions Logic (Logic Bisnis)
      // Check if we need to reshuffle/select questions

      // Call RPC to Select Questions
      const { data: selectedQuestions, error: rpcError } = await supabase.rpc(
        "select_questions_for_session",
        {
          p_quiz_id: quizData.id,
          p_session_id: sessionId,
          p_question_limit: questionLimit
        }
      );

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error("Gagal memilih soal");
      }

      // Update Main DB with selected questions
      const { error: updateQError } = await supabase
        .from("game_sessions")
        .update({ current_questions: selectedQuestions || [] })
        .eq("id", sessionId);

      if (updateQError) throw updateQError;

      // Update Realtime DB with selected questions
      if (isRealtimeDbConfigured) {
        await updateGameSessionRT(sessionId, {
          current_questions: selectedQuestions || []
        });
      }

      toast.success("Pengaturan disimpan");
      router.push(`/host/${sessionId}/room`); // Redirect to waiting room (usually next step)
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  const totalQuestions = quizData?.questions?.length || 0;

  return (
    <div className="base-background flex h-screen items-center justify-center">
      <Card className="card mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight text-orange-900 lg:text-2xl dark:text-zinc-100">
            Settings
          </CardTitle>
          <CardDescription className="text-orange-800/60 dark:text-zinc-400">
            {quizData?.title || "Quiz Title"}
          </CardDescription>
        </CardHeader>

        <Separator className="bg-orange-100 dark:bg-zinc-800" />

        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Duration Select */}
            <div className="w-full flex-1 space-y-2">
              <Label className="text-orange-900 dark:text-zinc-300">Quiz Duration (Minutes)</Label>
              <Select value={totalTimeMinutes} onValueChange={setTotalTimeMinutes}>
                <SelectTrigger className="input w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="dark:border-zinc-800 dark:bg-zinc-900">
                  {[5, 10, 15, 20, 25, 30].map((min) => (
                    <SelectItem key={min} value={min.toString()}>
                      {min} Minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Limit Select */}
            <div className="flex-1 space-y-2">
              <Label className="text-orange-900 dark:text-zinc-300">Total Questions</Label>
              <Select value={questionLimit} onValueChange={setQuestionLimit}>
                <SelectTrigger className="input w-full">
                  <SelectValue placeholder="Select question limit" />
                </SelectTrigger>
                <SelectContent className="dark:border-zinc-800 dark:bg-zinc-900">
                  {[5, 10, 20]
                    .filter((n) => n <= totalQuestions)
                    .map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Questions
                      </SelectItem>
                    ))}
                  {![5, 10, 20].includes(totalQuestions) && totalQuestions <= 20 && (
                    <SelectItem value={totalQuestions.toString()}>
                      {totalQuestions} Questions
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-orange-100 dark:bg-zinc-800" />

          {/* Game Mode */}
          <div className="space-y-4">
            <Label className="text-orange-900 dark:text-zinc-300">Game Mode</Label>
            <RadioGroup
              value={gameEndMode}
              onValueChange={setGameEndMode}
              className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* First Finish Mode */}
              <div
                onClick={() => setGameEndMode("first_finish")}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
                  gameEndMode === "first_finish"
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:border-orange-500/50 dark:bg-orange-950/20"
                    : "input"
                }`}>
                <RadioGroupItem
                  value="first_finish"
                  id="first_finish"
                  className="border-orange-500 text-orange-600 dark:border-zinc-600"
                />
                <div className="flex flex-1 flex-col pl-2">
                  <Label
                    htmlFor="first_finish"
                    className="cursor-pointer font-semibold text-orange-900 dark:text-zinc-100">
                    First Completed
                  </Label>
                  <p className="mt-1 text-xs text-orange-800/60 dark:text-zinc-400">
                    Game ends when the first person finishes all questions
                  </p>
                </div>
                <Trophy size={18} className="text-yellow-500" />
              </div>

              {/* Wait Timer Mode */}
              <div
                onClick={() => setGameEndMode("wait_timer")}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
                  gameEndMode === "wait_timer"
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500 dark:border-orange-500/50 dark:bg-orange-950/20"
                    : "border-orange-100 hover:bg-orange-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                }`}>
                <RadioGroupItem
                  value="wait_timer"
                  id="wait_timer"
                  className="border-orange-500 text-orange-600 dark:border-zinc-600"
                />
                <div className="flex flex-1 flex-col pl-2">
                  <Label
                    htmlFor="wait_timer"
                    className="cursor-pointer font-semibold text-orange-900 dark:text-zinc-100">
                    Wait for Time
                  </Label>
                  <p className="mt-1 text-xs text-orange-800/60 dark:text-zinc-400">
                    Everyone plays until the time fully runs out
                  </p>
                </div>
                <Hourglass size={18} className="text-orange-500" />
              </div>
            </RadioGroup>
          </div>

          {/* Late Join */}
          <div className="flex items-center gap-4 rounded-xl border border-green-100 bg-green-50/30 p-4 dark:border-green-900/30 dark:bg-green-950/10">
            <Checkbox
              id="allow_late"
              checked={allowJoinAfterStart}
              onCheckedChange={(checked) => setAllowJoinAfterStart(checked as boolean)}
              className="border-green-500 text-white data-[state=checked]:bg-green-500 dark:border-green-700"
            />
            <div
              className="cursor-pointer"
              onClick={() => setAllowJoinAfterStart(!allowJoinAfterStart)}>
              <Label
                htmlFor="allow_late"
                className="cursor-pointer font-semibold text-green-900 dark:text-green-400">
                Allow late joiners
              </Label>
              <p className="mt-0.5 text-xs text-green-800/60 dark:text-green-500/60">
                Users can join the quiz session even after it has started
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-4 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="button-orange-outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="button-orange">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog support dark mode */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="dark:border-zinc-800 dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-900 dark:text-zinc-100">
              Do you want to leave?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-orange-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveSession}
              className="bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
