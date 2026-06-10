import { PageSkeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="min-h-screen px-4 py-4 md:px-6">
      <PageSkeleton />
    </main>
  );
}
