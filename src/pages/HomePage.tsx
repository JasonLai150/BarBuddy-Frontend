import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Upload, Eye, TrendingUp, Target } from "lucide-react";
import barBuddyLogo from "@/assets/bar-buddy-logo.png";

export default function HomePage() {
  const stats = [
    { label: "Total Lifts", value: "0", icon: TrendingUp },
    { label: "Valid Lifts", value: "0", icon: Target },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col items-center text-center md:mb-12">
          <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-secondary shadow-lg md:h-32 md:w-32">
            <img 
              src={barBuddyLogo} 
              alt="Bar Buddy Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Bar Buddy
          </h1>
          <p className="mt-3 max-w-md text-muted-foreground md:text-lg">
            AI-powered lift analysis with computer vision to perfect your form
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:max-w-2xl lg:mx-auto">
          <Link to="/upload" className="block">
            <Card className="group cursor-pointer border-2 transition-all duration-200 hover:border-primary hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Upload Lift</h3>
                  <p className="text-sm text-muted-foreground">
                    Analyze a new lift video
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/view" className="block">
            <Card className="group cursor-pointer border-2 transition-all duration-200 hover:border-primary hover:shadow-lg">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Eye className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">View Results</h3>
                  <p className="text-sm text-muted-foreground">
                    See your analyzed lifts
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="lg:max-w-2xl lg:mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Stats</CardTitle>
              <CardDescription>
                Track your progress over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 p-4"
                  >
                    <stat.icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
