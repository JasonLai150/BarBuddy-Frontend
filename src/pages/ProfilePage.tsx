import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, Target, Award, Settings } from "lucide-react";

export default function ProfilePage() {
  // Placeholder user data
  const user = {
    name: "Athlete",
    email: "athlete@barbuddy.com",
    joinDate: "January 2025",
    stats: {
      totalLifts: 0,
      validLifts: 0,
      benchPR: "—",
      squatPR: "—",
      deadliftPR: "—",
    },
  };

  const achievements = [
    { name: "First Lift", unlocked: false },
    { name: "Perfect Form", unlocked: false },
    { name: "10 Valid Lifts", unlocked: false },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Avatar className="mb-4 h-24 w-24 border-4 border-primary/20 md:h-32 md:w-32">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            {user.name}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Member since {user.joinDate}
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Lifting Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {user.stats.totalLifts}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Lifts</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {user.stats.validLifts}
                  </p>
                  <p className="text-sm text-muted-foreground">Valid Lifts</p>
                </div>
                <div className="col-span-2 rounded-lg bg-muted/50 p-4 text-center md:col-span-1">
                  <p className="text-2xl font-bold text-primary">
                    {user.stats.totalLifts > 0
                      ? `${((user.stats.validLifts / user.stats.totalLifts) * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-lift-bench/30 bg-lift-bench/5 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {user.stats.benchPR}
                  </p>
                  <p className="text-xs text-muted-foreground">Bench PR</p>
                </div>
                <div className="rounded-lg border border-lift-squat/30 bg-lift-squat/5 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {user.stats.squatPR}
                  </p>
                  <p className="text-xs text-muted-foreground">Squat PR</p>
                </div>
                <div className="rounded-lg border border-lift-deadlift/30 bg-lift-deadlift/5 p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {user.stats.deadliftPR}
                  </p>
                  <p className="text-xs text-muted-foreground">Deadlift PR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription>
                Unlock achievements as you progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <Badge
                    key={achievement.name}
                    variant={achievement.unlocked ? "default" : "outline"}
                    className={
                      achievement.unlocked
                        ? ""
                        : "border-dashed text-muted-foreground"
                    }
                  >
                    {achievement.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings Button */}
          <Button variant="outline" className="w-full" size="lg">
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
}
