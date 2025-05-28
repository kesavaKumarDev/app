// FileUtils.js - Shared utilities for file handling
import { useState, useRef } from "react";

// Custom hook for file handling logic
export const useFileUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match("image.*")) {
      return {
        success: false,
        message: "Please select an image file",
      };
    }

    setSelectedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    return { success: true };
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    selectedImage,
    setSelectedImage,
    previewUrl,
    setPreviewUrl,
    fileInputRef,
    handleFileChange,
    triggerFileInput,
    resetImageSelection,
  };
};

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Format file size to appropriate units
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
  else return (bytes / 1048576).toFixed(2) + " MB";
};
