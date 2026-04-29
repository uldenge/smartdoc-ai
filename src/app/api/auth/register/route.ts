import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RegisterRequest {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequest;
    const { email, password } = body;

    // 输入验证
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "密码长度不能少于 8 位", code: "PASSWORD_TOO_SHORT" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const message =
        error.message === "User already registered"
          ? "该邮箱已注册"
          : error.message;
      return NextResponse.json(
        { error: message, code: "REGISTER_FAILED" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { data: { message: "注册成功，请查收验证邮件" }, error: null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
