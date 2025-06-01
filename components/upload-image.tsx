import React, { FC, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { IUploadModal, UploadedFile } from "@/types/client.types";
import {
  CloudUpload,
  X,
  FileImage,
  File,
  Upload,
  UploadIcon,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Text } from "./text";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { toast } from "sonner";
import Image from "next/image";
import axios from "axios";

export const UploadImage: FC<IUploadModal> = ({
  children,
  maxFileSize = 3,
  acceptableFiles = ["image"],
  onUpload,
  multiple = false,
  ...props
}) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const dragCounter = useRef(0);

  // Get acceptable file types for input accept attribute
  const getAcceptAttribute = useCallback(() => {
    const typeMap: Record<string, string> = {
      image: "image/*",
      video: "video/*",
      audio: "audio/*",
      document: ".pdf,.doc,.docx,.txt,.rtf",
      all: "*/*",
    };
    return acceptableFiles.map((type) => typeMap[type] || type).join(",");
  }, [acceptableFiles]);

  // Validate file type
  const isValidFileType = useCallback(
    (file: File) => {
      const fileType = file.type.split("/")[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      return acceptableFiles.some((acceptedType) => {
        if (acceptedType === "image" && fileType === "image") return true;
        if (acceptedType === "documents") {
          return ["pdf", "doc", "docx", "txt", "rtf"].includes(
            fileExtension || ""
          );
        }
        return acceptedType === fileExtension;
      });
    },
    [acceptableFiles]
  );

  // Validate file size
  const isValidFileSize = useCallback(
    (file: File) => {
      const fileSize = file.size / 1024 / 1024;
      return fileSize <= maxFileSize;
    },
    [maxFileSize]
  );

  // Process files
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: UploadedFile[] = [];

      fileArray.forEach((file) => {
        // Validate file type
        if (!isValidFileType(file)) {
          toast.error(`Invalid file type: ${file.name}`, {
            description: `Only ${acceptableFiles.join(", ")} files are allowed`,
          });
          return;
        }

        // Validate file size
        if (!isValidFileSize(file)) {
          toast.error(`File size too large: ${file.name}`, {
            description: `Please upload a file that is less than or equal to ${maxFileSize} MB`,
          });
          return;
        }

        // Check if not multiple and already have files
        if (!multiple && uploadedFiles.length > 0) {
          toast.error("Multiple files not allowed", {
            description:
              "Please remove the existing file before uploading a new one",
          });
          return;
        }

        const uploadedFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          uploaded: false,
        };

        validFiles.push(uploadedFile);
      });

      if (validFiles.length > 0) {
        if (multiple) {
          setUploadedFiles((prev) => [...prev, ...validFiles]);
        } else {
          // Clean up previous preview if exists
          uploadedFiles.forEach((f) => {
            if (f.preview) URL.revokeObjectURL(f.preview);
          });
          setUploadedFiles(validFiles);
        }
      }
    },
    [
      isValidFileType,
      isValidFileSize,
      maxFileSize,
      acceptableFiles,
      multiple,
      uploadedFiles,
    ]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      dragCounter.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const openFileExplorer = () => {
    ref.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(files);
    // Reset input
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      setIsUploading(true);
      const response = await axios.get(urlInput, {
        responseType: "blob", // This ensures we get the response as a blob
      });

      if (response.status !== 200) {
        throw new Error("Failed to fetch file from URL");
      }

      const blob = response.data;
      const filename = urlInput.split("/").pop() || "downloaded-file";

      // Create a File-like object that's compatible with your processFiles function
      const file = Object.assign(blob, {
        name: filename,
        lastModified: Date.now(),
        webkitRelativePath: "",
      }) as File;

      processFiles([file]);
      setUrlInput("");
      toast.success("File uploaded from URL successfully");
    } catch (error) {
      toast.error("Failed to upload from URL", {
        description: "Please check the URL and try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("No files to upload");
      return;
    }

    try {
      setIsUploading(true);

      // Simulate upload process or call actual upload function
      onUpload?.(uploadedFiles);

      // Mark files as uploaded
      setUploadedFiles((prev) => prev.map((f) => ({ ...f, uploaded: true })));

      toast.success("Files uploaded successfully");
    } catch (error) {
      toast.error("Upload failed", {
        description: "Please try again",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <FileImage className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="md:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Upload {acceptableFiles.includes("image") ? "Image" : "File"}
          </DialogTitle>
          <DialogDescription>
            You can drag and drop your media here or click to open your media
            explorer
          </DialogDescription>
        </DialogHeader>

        <Input
          ref={ref}
          type="file"
          className="hidden"
          accept={getAcceptAttribute()}
          multiple={multiple}
          onChange={handleFileChange}
        />

        <div className="w-full space-y-4">
          {/* Drop Zone */}
          <div
            onClick={openFileExplorer}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border border-dashed rounded-xl h-32 flex flex-col items-center justify-center p-5 cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/5 scale-105"
                : "border-primary hover:border-primary/80"
            }`}
          >
            <CloudUpload
              size={50}
              className={`transition-all duration-200 ${
                isDragOver ? "text-primary scale-110" : "text-primary/70"
              }`}
            />
            <h2 className="text-center">
              {isDragOver
                ? "Drop files here!"
                : "Drag and drop your files here or"}{" "}
              {!isDragOver && (
                <Button variant="link" className="px-1 font-bold">
                  browse
                </Button>
              )}
            </h2>
            <Text className="text-center">
              Max files of {maxFileSize} MB are allowed
            </Text>
          </div>

          <Text className="text-sm text-muted-foreground">
            Only supports {acceptableFiles.join(", ").toUpperCase()} files
          </Text>

          {/* File Preview */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <Text className="font-medium">
                Uploaded Files ({uploadedFiles.length})
              </Text>
              <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                {uploadedFiles.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center p-3 bg-muted/50 rounded-lg border"
                  >
                    {/* Preview */}
                    <div className="flex-shrink-0 mr-3">
                      {fileObj.preview ? (
                        <Image
                          src={fileObj.preview}
                          alt={fileObj.name}
                          width={50}
                          height={50}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(fileObj.type)}
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {fileObj.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileObj.size)}
                      </p>
                    </div>

                    {/* Status & Remove */}
                    <div className="flex items-center space-x-2">
                      {fileObj.uploaded ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(fileObj.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* URL Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 w-full">
              <Separator className="flex-1" />
              <Text className="text-sm text-muted-foreground px-2">OR</Text>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleUrlUpload} className="space-y-2">
              <label className="text-sm font-medium">UPLOAD FROM URL</label>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Provide a URL link and we will add the file for you"
                  className="flex-1"
                  disabled={isUploading}
                />
                <Button variant="secondary" size="icon" className="size-12">
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <UploadIcon size={20} />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={isUploading}>
              Close
            </Button>
          </DialogClose>
          <Button
            onClick={handleUpload}
            disabled={uploadedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              `Upload (${uploadedFiles.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
