import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Upload, Loader2 } from "lucide-react";

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
      <div className="relative min-h-full">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 -left-32 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        </div>
        
        <div className="container relative mx-auto flex h-full flex-col px-4 py-4 md:py-6">
          {/* Title */}
          <h1 className="mb-4 text-2xl font-bold text-foreground lg:max-w-2xl lg:mx-auto">Bar Buddy</h1>
          
          {/* Stats Section */}
          <div className="mb-4 lg:max-w-2xl lg:mx-auto">
            <Card className="border-primary/20 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Your Stats</CardTitle>
              <CardDescription className="text-xs">
                Track your progress over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-2 rounded-lg bg-muted/50 p-3"
                  >
                    <stat.icon className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
          <div className="flex-1 lg:max-w-2xl lg:mx-auto">
            <Card className="border-primary/20 bg-card/80 backdrop-blur">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Upload Your Lift</CardTitle>
              <CardDescription className="text-xs">
                Select a video and choose the lift type for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Lift Video
                </label>
                <VideoUploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={confirmedFile}
                  onClear={handleClearFile}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Lift Type
                </label>
                <LiftTypeSelector selected={liftType} onSelect={setLiftType} />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!canUpload}
                size="lg"
                className="w-full py-5 text-base font-semibold"
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
