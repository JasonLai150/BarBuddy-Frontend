import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye, TrendingUp, Target, Upload, Loader2 } from "lucide-react";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { LiftTypeSelector, LiftType } from "@/components/LiftTypeSelector";
import { ConfirmUploadDialog } from "@/components/ConfirmUploadDialog";
import { toast } from "sonner";

export default function HomePage() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmedFile, setConfirmedFile] = useState<File | null>(null);
  const [liftType, setLiftType] = useState<LiftType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const stats = [
    { label: "Total Lifts", value: "0", icon: TrendingUp },
    { label: "Valid Lifts", value: "0", icon: Target },
  ];

  const handleFileSelect = (file: File) => {
    setPendingFile(file);
    setShowConfirmDialog(true);
  };

  const handleConfirmFile = () => {
    if (pendingFile) {
      setConfirmedFile(pendingFile);
      setPendingFile(null);
      setShowConfirmDialog(false);
      toast.success("Video accepted successfully!");
    }
  };

  const handleCancelFile = () => {
    setPendingFile(null);
    setShowConfirmDialog(false);
  };

  const handleClearFile = () => {
    setConfirmedFile(null);
    setLiftType(null);
  };

  const handleUpload = async () => {
    if (!confirmedFile || !liftType) {
      toast.error("Please select a video and lift type");
      return;
    }

    setIsUploading(true);
    
    // Simulated upload - wire to API later
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success(`${liftType.charAt(0).toUpperCase() + liftType.slice(1)} lift uploaded for analysis!`);
    setConfirmedFile(null);
    setLiftType(null);
    setIsUploading(false);
  };

  const canUpload = confirmedFile && liftType && !isUploading;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Banner */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-center shadow-lg md:mb-12 md:py-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            BAR BUDDY
          </h1>
        </div>

        {/* Stats Section */}
        <div className="mb-8 lg:max-w-2xl lg:mx-auto">
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

        {/* Upload Section */}
        <div className="mb-8 lg:max-w-2xl lg:mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Upload Your Lift</CardTitle>
              <CardDescription>
                Select a video and choose the lift type for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Lift Video
                </label>
                <VideoUploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={confirmedFile}
                  onClear={handleClearFile}
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">
                  Lift Type
                </label>
                <LiftTypeSelector selected={liftType} onSelect={setLiftType} />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!canUpload}
                size="lg"
                className="w-full py-6 text-lg font-semibold"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload for Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action */}
        <div className="lg:max-w-2xl lg:mx-auto">
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
      </div>

      {/* Confirmation Dialog */}
      <ConfirmUploadDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        file={pendingFile}
        onConfirm={handleConfirmFile}
        onCancel={handleCancelFile}
      />
    </Layout>
  );
}
