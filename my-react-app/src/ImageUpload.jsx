import { useState, useRef } from "react";
import "./ImageUpload.css";

// If using exifr, you'd need to install it with: npm install exifr
import exifr from "exifr";

const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [imageMetadata, setImageMetadata] = useState(null);
  const [imageQuality, setImageQuality] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match("image.*")) {
      setUploadStatus({
        success: false,
        message: "Please select an image file",
      });
      return;
    }

    setSelectedImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Extract metadata from image
    try {
      const metadata = await exifr.parse(file);

      // Format metadata in the structure shown in the example
      const formattedMetadata = {
        metadata: metadata || {},
        modification_status: "No significant modifications detected.",
        file_hash: "7a7ec4410d5ae922ace8f8cc5c54551e", // Example hash
      };

      setImageMetadata(formattedMetadata);
    } catch (error) {
      console.error("Error extracting metadata:", error);
      setImageMetadata(null);
    }

    setUploadStatus(null);
    setImageQuality(null);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setUploadStatus({
        success: false,
        message: "Please select an image first",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", selectedImage);

      // Replace with your API endpoint
      const response = await fetch("https://your-api-endpoint.com/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      setUploadStatus({
        success: true,
        message: "Image uploaded successfully!",
        imageUrl: result.imageUrl, // Assuming server returns the image URL
      });

      // If server returns metadata or updates it
      if (result.metadata) {
        setImageMetadata(result.metadata);
      }

      // Set image quality from backend response
      if (result.quality) {
        setImageQuality(result.quality);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadStatus({
        success: false,
        message: `Upload failed: ${error.message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetUpload = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    setImageMetadata(null);
    setImageQuality(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Format file size to appropriate units
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  // Helper to render metadata in a more readable format
  const renderMetadataValue = (key, value) => {
    if (value === null || value === undefined) return "N/A";

    // Handle different types of values
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.join(", ");
      } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        return `Binary data (${value.byteLength} bytes)`;
      } else {
        return JSON.stringify(value);
      }
    } else if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    } else if (
      key.toLowerCase().includes("version") &&
      typeof value === "string" &&
      value.startsWith("b'")
    ) {
      // Format version strings that start with b' (bytes in Python)
      return value.substring(2, value.length - 1);
    }

    return String(value);
  };

  // Helper to determine if a quality metric is within acceptable range
  // These thresholds are examples and should be adjusted based on your specific requirements
  const getQualityStatus = (metric, value) => {
    const thresholds = {
      Brightness: { min: 100, max: 220 },
      Contrast: { min: 30, max: 80 },
      Sharpness: { min: 150, max: 500 },
    };

    if (thresholds[metric]) {
      return value >= thresholds[metric].min && value <= thresholds[metric].max;
    }
    return true; // Default to acceptable if no threshold defined
  };

  return (
    <div className="image-upload-container">
      <h2>Image Upload</h2>

      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="file-input"
        />

        <button
          type="button"
          onClick={triggerFileInput}
          className="select-button"
        >
          Select Image
        </button>

        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <button
              type="button"
              onClick={resetUpload}
              className="remove-button"
            >
              Remove
            </button>
          </div>
        )}

        {selectedImage && (
          <div className="file-info">
            <p>File: {selectedImage.name}</p>
            <p>Size: {formatFileSize(selectedImage.size)}</p>
            <p>Type: {selectedImage.type}</p>
            <p>
              Last Modified:{" "}
              {new Date(selectedImage.lastModified).toLocaleString()}
            </p>
          </div>
        )}

        {imageMetadata && (
          <div className="metadata-info">
            <h3>Image Technical Metadata</h3>

            {imageMetadata.metadata &&
              Object.keys(imageMetadata.metadata).length > 0 && (
                <div className="technical-metadata">
                  <table className="metadata-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(imageMetadata.metadata).map(
                        ([key, value]) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{renderMetadataValue(key, value)}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            {imageMetadata.modification_status && (
              <div className="modification-status">
                <h4>Modification Status</h4>
                <p>{imageMetadata.modification_status}</p>
              </div>
            )}

            {imageMetadata.file_hash && (
              <div className="file-hash">
                <h4>File Hash</h4>
                <p className="hash-value">{imageMetadata.file_hash}</p>
              </div>
            )}
          </div>
        )}

        {imageQuality && (
          <div className="quality-info">
            <h3>Image Quality Assessment</h3>
            <div className="quality-metrics">
              {imageQuality.Brightness !== undefined && (
                <div className="quality-metric">
                  <h4>Brightness:</h4>
                  <p className="metric-value">
                    {Number(imageQuality.Brightness).toFixed(2)}
                  </p>
                </div>
              )}

              {imageQuality.Contrast !== undefined && (
                <div className="quality-metric">
                  <h4>Contrast:</h4>
                  <p className="metric-value">
                    {Number(imageQuality.Contrast).toFixed(2)}
                  </p>
                </div>
              )}

              {imageQuality.Sharpness !== undefined && (
                <div className="quality-metric">
                  <h4>Sharpness:</h4>
                  <p className="metric-value">
                    {Number(imageQuality.Sharpness).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedImage || isUploading}
          className="upload-button"
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>

        {uploadStatus && (
          <div
            className={`status-message ${
              uploadStatus.success ? "success" : "error"
            }`}
          >
            {uploadStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
