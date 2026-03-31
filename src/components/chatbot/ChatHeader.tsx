const ChatHeader = () => (
  <div className="bg-primary px-4 py-3 flex items-center gap-3 shadow-md">
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
      <span className="text-secondary-foreground font-bold text-sm">SS</span>
    </div>
    <div>
      <h1 className="text-primary-foreground font-semibold text-base">신세계사이먼</h1>
      <p className="text-primary-foreground/70 text-xs">프리미엄 아울렛 고객센터</p>
    </div>
  </div>
);

export default ChatHeader;
