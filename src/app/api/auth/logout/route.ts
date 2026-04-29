import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: "登出失败", code: "LOGOUT_FAILED" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: { message: "已登出" }, error: null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
