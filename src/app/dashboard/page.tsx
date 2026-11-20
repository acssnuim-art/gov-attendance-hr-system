"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TimeApiResponse {
  timezone: string;
  date: string;
  time: string;
  thaiDateFull: string;
  thaiDateTimeFull: string;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  role: string | null;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [timeData, setTimeData] = useState<TimeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("full_name, email, employee_code, role")
        .eq("id", user.id)
        .single();

      setProfile(
        userRow || {
          full_name: user.user_metadata?.full_name || "ผู้ใช้งานระบบ",
          email: user.email || null,
          employee_code: user.user_metadata?.employee_code || null,
          role: "employee",
        }
      );

      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await fetch("/api/time", { cache: "no-store" });
        if (res.ok) {
          const data: TimeApiResponse = await res.json();
          setTimeData(data);
        }
      } catch (err) {
        console.error("Failed to fetch time:", err);
      }
    };

    fetchServerTime();
    const interval = setInterval(fetchServerTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              แดชบอร์ดบุคลากร (Employee Dashboard)
            </h1>
            <p className="text-xs text-slate-500">
              ระบบบริหารเวลาและทรัพยากรบุคคล (เวลาประเทศไทย Asia/Bangkok)
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition cursor-pointer"
          >
            {signingOut ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">
            เวลาปฏิบัติงานปัจจุบัน (UTC+7)
          </p>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {timeData?.time || "--:--:--"} น.
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {timeData?.thaiDateFull || "กำลังดึงข้อมูลวันที่..."}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            ข้อมูลผู้ใช้งาน
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500">ชื่อ-นามสกุล</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {profile?.full_name || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">รหัสบุคลากร</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {profile?.employee_code || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">อีเมล</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {profile?.email || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">สิทธิ์การใช้งาน</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {profile?.role || "employee"}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
