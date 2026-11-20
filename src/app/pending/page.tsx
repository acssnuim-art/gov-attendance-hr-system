"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<"pending" | "suspended" | "loading">("loading");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userRecord } = await supabase
        .from("users")
        .select("role, account_status")
        .eq("id", user.id)
        .single();

      if (userRecord?.account_status === "active") {
        router.push(userRecord.role === "admin" ? "/admin/dashboard" : "/dashboard");
        router.refresh();
        return;
      }

      if (userRecord?.account_status === "suspended") {
        setStatus("suspended");
      } else {
        setStatus("pending");
      }
    };

    checkStatus();
  }, [router, supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700 text-2xl font-bold mb-5">
          !
        </div>

        {status === "loading" ? (
          <p className="text-slate-600 text-sm">กำลังตรวจสอบสถานะบัญชี...</p>
        ) : status === "suspended" ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              บัญชีผู้ใช้งานถูกระงับชั่วคราว
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              บัญชีของคุณถูกระงับการใช้งานชั่วคราว หากมีข้อสงสัยหรือต้องการตรวจสอบสถานะ กรุณาติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่ทรัพยากรบุคคล
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              บัญชีอยู่ระหว่างรอการอนุมัติ
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              ระบบได้รับข้อมูลการสมัครสมาชิกเรียบร้อยแล้ว ขณะนี้อยู่ระหว่างรอผู้ดูแลระบบตรวจสอบและอนุมัติสิทธิ์การใช้งาน เมื่อได้รับการอนุมัติแล้วจึงจะสามารถเข้าใช้งานระบบได้ตามปกติ
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm transition cursor-pointer"
          >
            ตรวจสอบสถานะอีกครั้ง
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium text-sm transition cursor-pointer"
          >
            {signingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}
