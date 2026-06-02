const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="flex gap-1">
      <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" />
    </div>
  </div>
);

export default PageFallback;
