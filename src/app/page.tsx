import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'

export default function Home() {
  return (
    <div className="box-border flex h-dvh min-h-0 flex-row overflow-hidden md:gap-2 md:p-2">
      <Sidebar />
      <ChatArea />
    </div>
  )
}
