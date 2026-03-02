"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Target, ChevronRight, Users } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface SessionData {
  session_id: string;
  participant_id: string;
  play_date: string;
  user_score: number;
  highest_score: number;
  application: string;
  participant_count: number;
}

const getApplicationInfo = (application?: string) => {
  const appMap: Record<string, { name: string; shortName: string; colorClass: string }> = {
    "gameforsmart.com": {
      name: "GameForSmart",
      shortName: "GFS",
      colorClass: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
    },
    "space-quiz": {
      name: "Space Quiz",
      shortName: "SQ",
      colorClass: "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
    },
    "quiz-rush": {
      name: "Quiz Rush",
      shortName: "QR",
      colorClass: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
    },
    crazyrace: {
      name: "Crazy Race",
      shortName: "CR",
      colorClass: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
    },
    memoryquiz: {
      name: "Memory Quiz",
      shortName: "MQ",
      colorClass: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
    },
    "horror-quiz": {
      name: "Horror Quiz",
      shortName: "HQ",
      colorClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
    }
  };

  if (!application) {
    return {
      name: "Unknown",
      shortName: "?",
      colorClass: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
    };
  }

  return (
    appMap[application] || {
      name: application,
      shortName: application.substring(0, 3).toUpperCase(),
      colorClass: "bg-gray-100 text-gray-700 border-gray-200"
    }
  );
};

function QuizEvaluationContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const searchParams = useSearchParams();

  // Get start and end dates from URL params
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/evaluation/${quizId}`);
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user, loading, router, quizId]);

  useEffect(() => {
    if (userProfileId && quizId) {
      fetchQuizSessions();
    }
  }, [userProfileId, quizId, startParam, endParam]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setUserProfileId(data?.id || null);
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const fetchQuizSessions = async () => {
    if (!user || !quizId || !userProfileId) return;

    try {
      setLoadingData(true);

      // Parse dates from URL params
      let start: Date;
      let end: Date;

      if (startParam && endParam) {
        start = new Date(startParam + "T00:00:00");
        end = new Date(endParam + "T23:59:59");
      } else {
        // Default to this month if no params
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now);
      }

      // Fetch quiz info
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("title")
        .eq("id", quizId)
        .single();

      if (quizError) {
        console.error("Error fetching quiz:", quizError);
      } else {
        setQuizTitle(quizData?.title || "Unknown Quiz");
      }

      // Fetch sessions for this quiz (from all applications)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("game_sessions")
        .select(
          `
          id,
          started_at,
          ended_at,
          participants,
          application
        `
        )
        .eq("quiz_id", quizId)
        .not("started_at", "is", null)
        .not("ended_at", "is", null)
        .gte("started_at", start.toISOString())
        .lte("started_at", end.toISOString())
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Filter only sessions where user participated
      const sessionsList: SessionData[] = [];

      (sessionsData || []).forEach((session: any) => {
        const participants = session.participants || [];
        const userParticipation = participants.find((p: any) => p.user_id === userProfileId);

        if (userParticipation) {
          // Calculate highest score from all participants
          const highestScore = participants.reduce((max: number, p: any) => {
            return Math.max(max, p.score || 0);
          }, 0);

          sessionsList.push({
            session_id: session.id,
            participant_id: userParticipation.id,
            play_date: session.started_at,
            user_score: userParticipation.score || 0,
            highest_score: highestScore,
            application: session.application || "unknown",
            participant_count: participants.length
          });
        }
      });

      setSessions(sessionsList);
    } catch (error) {
      console.error("Error fetching quiz sessions:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data sesi",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/result/${sessionId}`);
  };

  // Pagination logic
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Format date to "28 Nov 2025 14.26"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day} ${month} ${year} ${hours}.${minutes}`;
  };

  // Format period label from dates
  const getPeriodLabel = () => {
    if (!startParam || !endParam) return "Bulan Ini";

    const start = new Date(startParam);
    const end = new Date(endParam);

    const formatSimple = (d: Date) => {
      const day = d.getDate();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    };

    return `${formatSimple(start)} - ${formatSimple(end)}`;
  };

  if (loading) {
    return null;
  }

  return (
    <div className="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/evaluation"
                  className="hover:text-orange-600 dark:hover:text-orange-400">
                  Evaluation
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detail</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="truncate text-2xl font-bold sm:text-3xl" title={quizTitle}>
            {loadingData ? <Skeleton className="h-8 w-48" /> : quizTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Periode: {getPeriodLabel()}</p>
        </div>

        {/* Sessions List */}
        <Card className="rounded-2xl border border-gray-100 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Permainan ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Belum ada sesi permainan untuk periode ini</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="">Aplikasi</TableHead>
                      <TableHead className="text-center">Pemain</TableHead>
                      <TableHead className="text-right">Skor</TableHead>
                      <TableHead className="text-right">Skor Tertinggi</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSessions.map((session) => (
                      <TableRow
                        key={session.session_id}
                        onClick={() =>
                          handleSessionClick(session.session_id)
                        }
                        className="cursor-pointer">
                        <TableCell className="p-0 text-sm text-gray-600 sm:p-4">
                          {formatDate(session.play_date)}
                        </TableCell>
                        <TableCell className="p-0 text-center sm:p-4 sm:text-left">
                          <Badge
                            className={`text-xs ${getApplicationInfo(session.application).colorClass}`}>
                            <span className="hidden sm:inline">
                              {getApplicationInfo(session.application).name}
                            </span>
                            <span className="sm:hidden">
                              {getApplicationInfo(session.application).shortName}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            {session.participant_count}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-800">
                            <Target className="h-4 w-4 text-yellow-500" />
                            {session.user_score}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-sm font-semibold text-green-600">
                            <Target className="h-4 w-4 text-green-500" />
                            {session.highest_score}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, index) => {
                          const page = index + 1;
                          const isCurrentPage = page === currentPage;

                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={isCurrentPage}
                                  className="cursor-pointer">
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }

                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QuizEvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  return <QuizEvaluationContent params={params} />;
}
