import BotSettingsFab from "@/components/chat/BotSettingsFab";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BotSettingsFab />
    </>
  );
}
