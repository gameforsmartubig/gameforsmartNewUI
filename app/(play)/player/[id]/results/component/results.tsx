"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getParticipantsRT,
  isRealtimeDbConfigured,
  getGameSessionRT
} from "@/lib/supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Loader2, Trophy } from "lucide-react";

interface ResultsProps {
  sessionId: string;
}

export default function Results({ sessionId }: ResultsProps) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myData, setMyData] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);

  // 1. Resolve Participant ID
  useEffect(() => {
    const findMyParticipantId = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        toast.error("User ID not found in storage");
        router.push("/join");
        return;
      }

      setLoading(true);

      // Try RT first
      if (isRealtimeDbConfigured) {
        const parts = await getParticipantsRT(sessionId);
        const myPart = parts.find((p: any) => p.user_id === userId);
        if (myPart) {
          setParticipantId(myPart.id);
          // Set data immediately
          setMyData(myPart);
          setAllParticipants(parts);
          return;
        }
      }

      // Try Main DB
      const { data: sess } = await supabase
        .from("game_sessions")
        .select("*, participants")
        .eq("id", sessionId)
        .single();

      if (sess) {
        setSession(sess);
        const parts = sess.participants || [];
        const myPart = parts.find((p: any) => p.user_id === userId);
        if (myPart) {
          setParticipantId(myPart.id);
          setMyData(myPart);
          setAllParticipants(parts);
          return;
        }
      }

      // If still not found
      if (!participantId) {
        toast.error("You are not part of this session");
        router.push("/join");
      }
      setLoading(false);
    };

    findMyParticipantId();
  }, [sessionId, participantId]); // participantId dependency just to ensure re-eval if needed

  // 2. Fetch Session & Rank if ID found
  useEffect(() => {
    if (!participantId || !myData) return;

    const fetchDetails = async () => {
      // Logic to fetch detailed session if not already fetched
      if (!session) {
        const s = await getGameSessionRT(sessionId);
        setSession(s);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [participantId, myData, sessionId, session]);

  if (loading || !myData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Calculate Rank
  const sorted = [...allParticipants].sort((a, b) => (b.score || 0) - (a.score || 0));
  const myRank = sorted.findIndex((p) => p.id === participantId) + 1;

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-zinc-950">
      <div className="mx-auto max-w-md space-y-6 pt-10">
        <div className="flex justify-center">
          <Image
            src="/gameforsmartlogo.png"
            width={200}
            height={40}
            alt="gameforsmart"
            className="opacity-90 dark:opacity-100"
            unoptimized
          />
        </div>

        <Card className="overflow-hidden border-0 shadow-lg dark:bg-zinc-900">
          <div className="bg-purple-600 p-6 text-center text-white">
            <Trophy className="mx-auto mb-2 h-12 w-12 text-yellow-300" />
            <h1 className="text-2xl font-bold">Quiz Completed!</h1>
            <p className="opacity-90">Thank you for playing</p>
          </div>
          <CardContent className="flex flex-col items-center space-y-6 p-6">
            <div className="text-center">
              <Avatar className="mx-auto mb-3 h-20 w-20 border-4 border-purple-100 dark:border-purple-900">
                <AvatarImage src={myData.avatar_url || ""} />
                <AvatarFallback className="text-2xl">
                  {myData.nickname?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold dark:text-zinc-100">{myData.nickname}</h2>
              <p className="text-muted-foreground dark:text-zinc-400">
                Rank {myRank} of {allParticipants.length}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-4">
              <div className="rounded-xl bg-purple-50 p-4 text-center dark:bg-purple-900/20">
                <p className="text-muted-foreground text-xs font-bold uppercase dark:text-purple-300">
                  Score
                </p>
                <p className="text-3xl font-black text-purple-600 dark:text-purple-400">
                  {myData.score || 0}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                <p className="text-muted-foreground text-xs font-bold uppercase dark:text-blue-300">
                  Correct
                </p>
                {/* We might need real counts, for now placeholder or generic */}
                <p className="text-3xl font-black text-blue-600 dark:text-blue-400">-</p>
              </div>
            </div>

            <Button
              className="w-full bg-purple-600 font-bold hover:bg-purple-700"
              onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
