import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ConversationList } from "@/components/chat/conversation-list";

export default async function ChatListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-full">
      {/* 左侧：对话列表 */}
      <div className="w-72 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-sm font-semibold">对话历史</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            所有基于知识库的 AI 对话
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
        <div className="p-3 border-t">
          <a
            href="/dashboard"
            className="block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            从知识库开始新对话
          </a>
        </div>
      </div>

      {/* 右侧：空状态 */}
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="text-5xl">💬</div>
          <p className="text-lg font-medium">选择一个对话开始</p>
          <p className="text-sm">或从知识库开始一个新对话</p>
        </div>
      </div>
    </div>
  );
}
