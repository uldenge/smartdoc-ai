import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 获取对话信息
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, knowledge_base_id, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    redirect("/dashboard");
  }

  // 获取知识库名称
  const { data: kb } = await supabase
    .from("knowledge_bases")
    .select("name")
    .eq("id", conversation.knowledge_base_id)
    .single();

  return (
    <ChatContainer
      conversationId={conversation.id}
      knowledgeBaseId={conversation.knowledge_base_id}
      knowledgeBaseName={kb?.name || "未知知识库"}
    />
  );
}
