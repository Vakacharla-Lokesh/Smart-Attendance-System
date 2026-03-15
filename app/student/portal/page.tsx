"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StudentTimetablePage() {
  const router = useRouter(); 
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [studentInfo, setStudentInfo] = useState<{name: string, enroll_no: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token || !userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setStudentInfo(user);
      
      fetch(`/api/student/timetable?enroll_no=${user.enroll_no}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTimetables(data.timetables || []);
          }
          setLoadingTimetable(false);
        })
        .catch(err => {
          console.error("Failed to fetch timetable", err);
          setLoadingTimetable(false);
        });
    } catch(e) {
      console.error("Invalid user data", e);
      setLoadingTimetable(false);
    }
  }, [router]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  // Define standard time slots
  const timeSlots = [
    { label: "09:00 AM - 10:00 AM", start: "09:00", end: "10:00" },
    { label: "10:00 AM - 11:00 AM", start: "10:00", end: "11:00" },
    { label: "11:00 AM - 12:00 PM", start: "11:00", end: "12:00" },
    { label: "12:00 PM - 01:00 PM", start: "12:00", end: "13:00" },
    { label: "01:00 PM - 02:00 PM", start: "13:00", end: "14:00" },
    { label: "02:00 PM - 03:00 PM", start: "14:00", end: "15:00" },
  ];

  if (loadingTimetable) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your timetable...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/home">
              <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CalendarClock className="w-8 h-8 text-primary" />
              Weekly Timetable
            </h1>
            <p className="text-muted-foreground mt-2">
              Viewing schedule for <span className="font-semibold text-foreground">{studentInfo?.name || studentInfo?.enroll_no || "Student"}</span>
            </p>
          </div>
        </div>

        {/* Timetable Grid */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-xl">Class Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {timetables.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <CalendarClock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No classes scheduled</p>
                <p className="text-sm">Your timetable has not been configured yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-r border-border font-semibold text-muted-foreground bg-muted/20 w-32 text-center">
                      Time Slot
                    </th>
                    {days.map((day) => (
                      <th key={day} className="p-4 border-b border-border font-semibold text-foreground bg-muted/10 min-w-[140px] text-center">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={slot.start} className="hover:bg-muted/5 transition-colors">
                      <td className="p-3 border-b border-r border-border text-center bg-muted/10 tracking-wider">
                        <div className="text-sm font-semibold text-foreground">{slot.start}</div>
                        <div className="text-xs text-muted-foreground">to {slot.end}</div>
                      </td>
                      {days.map((day) => {
                        const classInSlot = timetables.find((t: any) => {
                          if (!t.start_time) return false;
                          const tStart = new Date(t.start_time).toTimeString().slice(0, 5);
                          return t.day === day && tStart === slot.start;
                        });

                        return (
                          <td key={`${day}-${slot.start}`} className="p-2 border-b border-r border-border h-[100px] last:border-r-0">
                            {classInSlot ? (
                              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 h-full flex flex-col justify-center transition-all hover:bg-primary/20 hover:border-primary/40 group">
                                <div className="font-bold text-primary text-sm truncate" title={classInSlot.course_id?.course_name}>
                                  {classInSlot.course_id?.course_code || "Class"}
                                </div>
                                <div className="text-xs text-foreground/80 mt-1 line-clamp-2">
                                  {classInSlot.course_id?.course_name || ""}
                                </div>
                                <div className="text-[11px] font-medium text-muted-foreground mt-auto pt-2 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block"></span>
                                  Room: {classInSlot.room_id?.room_number || "TBA"}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 text-xs">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
