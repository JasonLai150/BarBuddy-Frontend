import { useCallback, useRef, useState } from "react";
import { Upload, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function VideoUploadZone({ onFileSelect, selectedFile, onClear }: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (selectedFile) {
    return (
      <div className="relative rounded-lg border-2 border-primary bg-primary/5 p-6">
        <button
          onClick={onClear}
          className="absolute right-3 top-3 rounded-full bg-destructive p-1.5 text-destructive-foreground transition-transform hover:scale-110"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all duration-200 md:min-h-[280px]",
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 md:h-20 md:w-20",
          isDragging ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <Upload className={cn(
            "h-8 w-8 md:h-10 md:w-10",
            isDragging ? "animate-bounce" : ""
          )} />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground md:text-xl">
            {isDragging ? "Drop your video here" : "Upload your lift video"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Drag and drop or tap to select
          </p>
        </div>
      </button>
    </>
  );
}
