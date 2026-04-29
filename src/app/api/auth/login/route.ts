import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message =
        error.message === "Invalid login credentials"
          ? "邮箱或密码不正确"
          : error.message;
      return NextResponse.json(
        { error: message, code: "LOGIN_FAILED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { data: { message: "登录成功" }, error: null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
