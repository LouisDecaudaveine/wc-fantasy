import { Card, CardContent } from "@/components/ui/card";

export function PageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      <p className="sr-only">Loading {title}</p>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
