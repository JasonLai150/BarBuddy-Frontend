import { useState } from "react";
import { Layout } from "@/components/Layout";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { LiftTypeSelector, LiftType } from "@/components/LiftTypeSelector";
import { ConfirmUploadDialog } from "@/components/ConfirmUploadDialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmedFile, setConfirmedFile] = useState<File | null>(null);
  const [liftType, setLiftType] = useState<LiftType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Upload Your Lift
          </h1>
          <p className="mt-2 text-muted-foreground">
            Select a video and choose the lift type for AI analysis
          </p>
        </div>

        <div className="mx-auto max-w-xl space-y-8">
          {/* Video Upload Zone */}
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

          {/* Lift Type Selector */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              Lift Type
            </label>
            <LiftTypeSelector selected={liftType} onSelect={setLiftType} />
          </div>

          {/* Upload Button */}
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

          {/* Help text */}
          <p className="text-center text-sm text-muted-foreground">
            Your video will be analyzed by our AI to determine lift validity and visualize your form.
          </p>
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
