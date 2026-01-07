import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Video, Calendar } from "lucide-react";

export default function ViewPage() {
  // Placeholder - will be populated with analyzed lifts later
  const analyzedLifts: any[] = [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            View Results
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review your analyzed lifts and form feedback
          </p>
        </div>

        {analyzedLifts.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Eye className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No Analyzed Lifts Yet
              </h3>
              <p className="text-muted-foreground">
                Upload your first lift video to see AI-powered analysis and form visualization here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analyzedLifts.map((lift, index) => (
              <Card key={index} className="cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5 text-primary" />
                    {lift.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {lift.date}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
