"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            employee_code: employeeCode.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        return;
      }

      if (data.user) {
        const { error: insertError } = await supabase.from("users").upsert(
          {
            id: data.user.id,
            email: email.trim(),
            full_name: fullName.trim(),
            employee_code: employeeCode.trim() || null,
            role: "employee",
            account_status: "pending",
          },
          { onConflict: "id" }
        );

        if (insertError) {
          console.error("Error creating user profile:", insertError);
        }

        router.push("/pending");
        router.refresh();
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-900 text-white text-xl font-bold mb-4 shadow-sm">
            HR
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            สมัครสมาชิกผู้ใช้งานระบบ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ลงทะเบียนเพื่อขอเข้าใช้งานระบบบริหารเวลาและทรัพยากรบุคคล
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              ชื่อ-นามสกุล
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น นายสมชาย ใจดี"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition"
            />
          </div>

          <div>
            <label
              htmlFor="employeeCode"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              รหัสบุคลากร / เลขที่ตำแหน่ง (ถ้ามี)
            </label>
            <input
              id="employeeCode"
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="เช่น EMP-001"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              อีเมลราชการ / อีเมลผู้ใช้งาน
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@agency.go.th"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              ยืนยันรหัสผ่าน
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-blue-800 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium text-sm transition cursor-pointer mt-2"
          >
            {loading ? "กำลังลงทะเบียน..." : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-900 hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
