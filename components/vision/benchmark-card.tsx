import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { computeUserBenchmark } from "@/lib/vision/benchmark";

export async function BenchmarkCard({ userId }: { userId: string }) {
  const benchmark = await computeUserBenchmark(userId);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <p className="nr-label-caps mb-2">Peer benchmark</p>
        <CardTitle className="text-3xl tabular-nums text-primary">
          {benchmark.percentile != null
            ? `${benchmark.percentile}th`
            : "—"}
        </CardTitle>
        {benchmark.percentile != null ? (
          <CardDescription className="font-mono text-xs uppercase tracking-widest">
            percentile
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 font-mono text-[13px] text-muted-foreground">
        <p>
          Compared to {benchmark.cohort_label.toLowerCase()} (n=
          {benchmark.sample_size})
        </p>
        {benchmark.readiness_index != null ? (
          <p>Your readiness index: {benchmark.readiness_index}</p>
        ) : (
          <p>Complete a scored interview to see your rank.</p>
        )}
      </CardContent>
    </Card>
  );
}
