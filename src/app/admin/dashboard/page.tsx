"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TimeApiResponse {
  timezone: string;
  date: string;
  time: string;
  thaiDateFull: string;
  thaiDateTimeFull: string;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_code: string | null;
  role: string | null;
  account_status: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [timeData, setTimeData] = useState<TimeApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadAdminData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const { data: allUsers } = await supabase
      .from("users")
      .select("id, full_name, email, employee_code, role, account_status")
      .order("email", { ascending: true });

    setUsers(allUsers || []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

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

  const handleUpdateStatus = async (
    targetUserId: string,
    newStatus: "active" | "suspended"
  ) => {
    setUpdatingId(targetUserId);
    const { error } = await supabase
      .from("users")
      .update({ account_status: newStatus })
      .eq("id", targetUserId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, account_status: newStatus } : u
        )
      );
    }
    setUpdatingId(null);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.account_status === "active").length;
  const pendingCount = users.filter((u) => u.account_status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">กำลังโหลดข้อมูลผู้ดูแลระบบ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              แดชบอร์ดผู้ดูแลระบบ (Admin Dashboard)
            </h1>
            <p className="text-xs text-slate-500">
              จัดการบัญชีผู้ใช้งานและอนุมัติสิทธิ์การเข้าใช้งานระบบ
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs text-slate-500">เวลาประเทศไทย (UTC+7)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {timeData?.time || "--:--:--"} น.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {timeData?.thaiDateFull || "-"}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs text-slate-500">บุคลากรทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs text-slate-500">อนุมัติแล้ว (Active)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {activeCount}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs text-slate-500">รออนุมัติ (Pending)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {pendingCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              รายชื่อผู้ใช้งานในระบบ
            </h2>
            <button
              type="button"
              onClick={loadAdminData}
              className="text-xs font-medium text-blue-900 hover:underline cursor-pointer"
            >
              รีเฟรชข้อมูล
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-4 font-semibold">รหัสบุคลากร</th>
                  <th className="py-3 px-4 font-semibold">อีเมล</th>
                  <th className="py-3 px-4 font-semibold">สิทธิ์</th>
                  <th className="py-3 px-4 font-semibold">สถานะบัญชี</th>
                  <th className="py-3 px-4 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      ยังไม่มีข้อมูลผู้ใช้งานในระบบ
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {u.full_name || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.employee_code || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.email || "-"}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {u.role || "employee"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            u.account_status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : u.account_status === "suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {u.account_status || "pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {u.account_status !== "active" && (
                          <button
                            type="button"
                            disabled={updatingId === u.id}
                            onClick={() => handleUpdateStatus(u.id, "active")}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                          >
                            อนุมัติ
                          </button>
                        )}
                        {u.account_status !== "suspended" && (
                          <button
                            type="button"
                            disabled={updatingId === u.id}
                            onClick={() => handleUpdateStatus(u.id, "suspended")}
                            className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
                          >
                            ระงับ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
