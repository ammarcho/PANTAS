export default function Loading() {
  return (
    <div className="flex flex-1 flex-col p-4 animate-pulse">
      {/* Fake Header */}
      <div className="h-12 w-full mb-6 rounded-lg bg-black/5" />
      
      {/* Fake Cards */}
      <div className="flex flex-col gap-4">
        <div className="h-32 w-full rounded-2xl bg-black/5" />
        <div className="h-32 w-full rounded-2xl bg-black/5" />
        <div className="h-32 w-full rounded-2xl bg-black/5" />
      </div>
    </div>
  );
}
