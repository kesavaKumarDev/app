import { useState, useRef, useEffect } from "react";
import "./ImageAnalysisNew.css";
import { API_ENDPOINTS } from "./apiConfig";
import TextAnalysis from "./TextAnalysis1";

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [analysisType, setAnalysisType] = useState("image"); // 'image' or 'text'
  const [analysisSubType, setAnalysisSubType] = useState(""); // Default to first option
  const [analysisResultImage, setAnalysisResultImage] = useState(null);
  const [deepfakeResult, setDeepfakeResult] = useState(null); // For deepfake results
  const [anomalyResult, setAnomalyResult] = useState(null); // For anomaly detection results
  const [forgeryResult, setForgeryResult] = useState(null); // For forgery detection results
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const fileInputRef = useRef(null);
  const resultsRef = useRef(null); // Add this line
  const historyPanelRef = useRef(null); // Add this new reference

  // Fetch saved analyses on component mount
  useEffect(() => {
    fetchSavedAnalyses();
  }, []);

  const fetchSavedAnalyses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_ANALYSES);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedAnalyses(data.analyses);
        }
      }
    } catch (error) {
      console.error("Error fetching saved analyses:", error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match("image.*")) {
      setProcessingStatus({
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

    // Reset any previous results
    setProcessingStatus(null);
    setAnalysisResultImage(null);
    setDeepfakeResult(null);
    setAnomalyResult(null);
    setForgeryResult(null); // Clear any forgery results
    setAnalysisSubType(""); // Set default to first option
  };

  const handleAnalysisTypeChange = (e) => {
    setAnalysisType(e.target.value);
    // Reset results when changing analysis type
    setAnalysisResultImage(null);
    setDeepfakeResult(null);
    setAnomalyResult(null);
    setForgeryResult(null); // Clear any forgery results
    setAnalysisSubType(""); // Set default to first option
  };

  const handleAnalysisSubTypeChange = (subType) => {
    setAnalysisSubType(subType);
    // Reset previous results
    setAnalysisResultImage(null);
    setDeepfakeResult(null);
    setAnomalyResult(null);
    setForgeryResult(null); // Clear any forgery results
    console.log(`Selected analysis subtype: ${subType}`);
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage) {
      setProcessingStatus({
        success: false,
        message: "Please select an image first",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStatus({
      success: true,
      message: `Analyzing image using ${analysisSubType}...`,
    });
    console.log("Starting analysis for:", analysisSubType);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", selectedImage);
      console.log("FormData created:", formData);

      // Different endpoints based on analysis subtype
      let endpoint;
      console.log("Selected analysis subtype:", analysisSubType);
      switch (analysisSubType) {
        case "error-level":
          endpoint = API_ENDPOINTS.ANALYZE_AND_VISUALIZE;
          break;
        case "clone-detection":
          endpoint = API_ENDPOINTS.CLONE_DETECTION;
          break;
        case "deepfake":
          endpoint = API_ENDPOINTS.DEEPFAKE_DETECTION;
          break;
        case "anomaly":
          endpoint = API_ENDPOINTS.ANOMALY_DETECTION;
          break;
        case "forgery":
          endpoint = API_ENDPOINTS.FORGERY_DETECTION;
          break;
        default:
          endpoint = API_ENDPOINTS.ANALYZE_AND_VISUALIZE;
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      console.log(
        "Current analysisSubType at time of response:",
        analysisSubType
      );

      let resultData = null;
      let resultBlob = null;

      // Handle different response types based on the analysis subtype
      if (
        analysisSubType === "error-level" ||
        analysisSubType === "clone-detection"
      ) {
        // Handle image blob responses
        resultBlob = await response.blob();
        const imageUrl = URL.createObjectURL(resultBlob);
        setAnalysisResultImage(imageUrl);
        console.log("Analysis result image URL:", imageUrl);
        resultData = { imageAnalysis: true };
      } else if (analysisSubType === "deepfake") {
        // Handle JSON response for deepfake detection
        const jsonData = await response.json();
        setDeepfakeResult(jsonData);
        resultData = jsonData;
      } else if (analysisSubType === "anomaly") {
        // Handle JSON response for anomaly detection
        const jsonData = await response.json();
        setAnomalyResult(jsonData);
        resultData = jsonData;
      } else if (analysisSubType === "forgery") {
        // Handle JSON response for forgery detection
        const jsonData = await response.json();
        setForgeryResult(jsonData);
        resultData = jsonData;
      }

      // Save results to MongoDB
      await saveAnalysisToMongoDB(resultData, resultBlob);

      setProcessingStatus({
        success: true,
        message: `${analysisSubType} analysis completed!`,
      });

      // Refresh the list of saved analyses
      fetchSavedAnalyses();
    } catch (error) {
      console.error("Error during analysis:", error);
      setProcessingStatus({
        success: false,
        message: `Analysis failed: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to save analysis results to MongoDB
  const saveAnalysisToMongoDB = async (resultData, resultBlob) => {
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("analysisType", analysisType);
      formData.append("analysisSubtype", analysisSubType);
      formData.append("fileSize", selectedImage.size.toString());

      // Add analysis result data
      formData.append("analysisResult", JSON.stringify(resultData || {}));

      // Add result image if available
      if (resultBlob) {
        const resultFile = new File(
          [resultBlob],
          `result_${selectedImage.name}`,
          {
            type: resultBlob.type,
          }
        );
        formData.append("resultImage", resultFile);
      }

      // Send to backend
      const response = await fetch(API_ENDPOINTS.SAVE_ANALYSIS, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Failed to save analysis:", result.message);
      } else {
        console.log("Analysis saved successfully:", result.analysisId);
      }
    } catch (error) {
      console.error("Error saving analysis to MongoDB:", error);
    }
  };

  const loadAnalysis = async (analysis) => {
    try {
      setProcessingStatus({
        success: true,
        message: "Loading saved analysis...",
      });

      // Set analysis type and subtype
      setCurrentAnalysisId(analysis._id);
      setAnalysisType(analysis.analysisType);
      setAnalysisSubType(analysis.analysisSubtype);

      // Load original image
      const originalImageResponse = await fetch(
        `https://render-3ux8.onrender.com/api/get-image/${analysis.originalImageId}`
      );
      if (!originalImageResponse.ok) {
        throw new Error("Failed to load original image");
      }

      // const originalImageBlob = await originalImageResponse.blob();
      // const originalFile = new File([originalImageBlob], analysis.fileName, {
      //   type: originalImageBlob.type,
      // });

      // setSelectedImage(originalFile);
      // setPreviewUrl(URL.createObjectURL(originalImageBlob));

      // Load result image if available
      if (analysis.resultImageId) {
        const resultImageResponse = await fetch(
          `https://render-3ux8.onrender.com/api/get-image/${analysis.resultImageId}`
        );
        if (resultImageResponse.ok) {
          const resultImageBlob = await resultImageResponse.blob();
          setAnalysisResultImage(URL.createObjectURL(resultImageBlob));
        }
      }

      // Set appropriate result data based on analysis subtype
      switch (analysis.analysisSubtype) {
        case "deepfake":
          setDeepfakeResult(analysis.analysisResult);
          break;
        case "anomaly":
          setAnomalyResult(analysis.analysisResult);
          break;
        case "forgery":
          setForgeryResult(analysis.analysisResult);
          break;
        default:
          break;
      }

      setProcessingStatus({
        success: true,
        message: "Analysis loaded successfully!",
      });

      // Hide history after loading
      // setShowHistory(false);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error loading analysis:", error);
      setProcessingStatus({
        success: false,
        message: `Failed to load analysis: ${error.message}`,
      });
    }
  };
  const deleteAllAnalyses = async () => {
    try {
      // Send delete request to backend
      const response = await fetch(API_ENDPOINTS.DELETE_ALL_ANALYSES, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        // Clear local state only after successful API call
        setSavedAnalyses([]);

        resetAll();

        console.log("All analyses deleted successfully");
      } else {
        console.error("Failed to delete all analyses:", result.message);
      }
    } catch (error) {
      console.error("Error deleting all analyses:", error);
    }
  };

  const deleteAnalysis = async (analysisId, event) => {
    // Prevent the click from propagating to the parent
    event.stopPropagation();

    try {
      const response = await fetch(
        `https://render-3ux8.onrender.com/api/delete-analysis/${analysisId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (result.success) {
        // Remove from local state
        setSavedAnalyses(savedAnalyses.filter((a) => a._id !== analysisId));

        // Check if the deleted analysis is currently being viewed
        if (currentAnalysisId === analysisId) {
          resetAll(); // Reset everything if the currently viewed analysis was deleted
        }
      } else {
        console.error("Failed to delete analysis:", result.message);
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetAll = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setProcessingStatus(null);
    setAnalysisResultImage(null);
    setDeepfakeResult(null);
    setAnomalyResult(null);
    setForgeryResult(null); // Clear forgery results
    setAnalysisSubType(""); // Reset to first option
    setCurrentAnalysisId(null); // Reset the current analysis ID
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetImageSelection = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  // Calculate confidence level display properties for deepfake results
  const getConfidenceBarStyle = (confidence) => {
    // Define color based on confidence level
    let color;
    if (confidence < 0.5) color = "#4CAF50"; // Green for likely real
    else if (confidence < 0.7) color = "#FF9800"; // Orange for uncertain
    else color = "#F44336"; // Red for likely fake

    return {
      width: `${confidence * 100}%`,
      backgroundColor: color,
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Display appropriate results based on the analysis type and data
  const renderResults = () => {
    if (analysisType === "image") {
      switch (analysisSubType) {
        case "error-level":
          if (analysisResultImage) {
            return (
              <div className="analysis-results">
                <h3>Error Level Analysis Results</h3>
                <div className="ela-result-container">
                  <img
                    src={analysisResultImage}
                    alt="Error Level Analysis Result"
                    className="ela-result-image"
                  />
                </div>
                <div className="result-explanation">
                  <p>
                    <strong>How to interpret:</strong> The right side shows the
                    Error Level Analysis visualization. Bright areas indicate
                    potential manipulation. The number of suspicious regions is
                    shown at the top.
                  </p>
                </div>
              </div>
            );
          }
          break;

        case "clone-detection":
          if (analysisResultImage) {
            return (
              <div className="analysis-results">
                <h3>Clone Detection Results</h3>
                <div className="clone-result-container">
                  <img
                    src={analysisResultImage}
                    alt="Clone Detection Result"
                    className="clone-result-image"
                  />
                </div>
                <div className="result-explanation">
                  <p>
                    <strong>How to interpret:</strong> The image highlights
                    areas that appear to be duplicated or cloned. Matching
                    regions are typically highlighted with the same color or
                    connected with lines.
                  </p>
                  <p>
                    Clone detection identifies areas that have been copied and
                    pasted within the same image, which is a common manipulation
                    technique.
                  </p>
                </div>
              </div>
            );
          }
          break;

        case "deepfake":
          if (deepfakeResult) {
            return (
              <div className="analysis-results">
                <h3>Deepfake Detection Results</h3>
                <div className="deepfake-result-container">
                  <div className="deepfake-status">
                    <h4>Analysis Verdict:</h4>
                    <div
                      className={`deepfake-label ${
                        deepfakeResult.label === "Deepfake" ? "fake" : "real"
                      }`}
                    >
                      {deepfakeResult.label}
                    </div>
                  </div>

                  <div className="confidence-meter">
                    <h4>
                      Confidence Level:{" "}
                      {(deepfakeResult.confidence * 100).toFixed(1)}%
                    </h4>
                    <div className="confidence-bar-container">
                      <div
                        className="confidence-bar"
                        style={getConfidenceBarStyle(deepfakeResult.confidence)}
                      ></div>
                    </div>
                    <div className="confidence-labels">
                      <span>Real</span>
                      <span>Uncertain</span>
                      <span>Fake</span>
                    </div>
                  </div>

                  <div className="result-explanation">
                    <p>
                      <strong>How to interpret:</strong> Our deepfake detection
                      algorithm has analyzed this image and
                      {deepfakeResult.confidence > 0.6
                        ? " detected strong indicators that this may be a deepfake or AI-generated image."
                        : deepfakeResult.confidence < 0.4
                        ? " found this image likely to be authentic."
                        : " found some suspicious patterns, but cannot determine with high confidence whether this is a deepfake."}
                    </p>
                    <p>
                      The confidence score indicates how certain the algorithm
                      is of its assessment. Higher percentages indicate greater
                      confidence in the deepfake verdict.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          break;

        case "anomaly":
          if (anomalyResult) {
            return (
              <div className="analysis-results">
                <h3>Anomaly Detection Results</h3>
                <div className="anomaly-result-container">
                  <div className="anomaly-findings">
                    <h4>Detected Anomalies:</h4>
                    <ul className="anomaly-list">
                      {anomalyResult.summary.map((finding, index) => (
                        <li key={index} className="anomaly-item">
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-explanation">
                    <p>
                      <strong>How to interpret:</strong> Our anomaly detection
                      algorithm has analyzed this image and identified potential
                      inconsistencies or artifacts that may indicate
                      manipulation.
                    </p>
                    <p>
                      Warning icons (⚠️) indicate areas of concern that should
                      be examined closely. The findings are based on statistical
                      analysis of image properties and may require expert
                      verification.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          break;

        case "forgery":
          if (forgeryResult) {
            // Get overall status for quick visual indication
            const imageAuthentic =
              !forgeryResult.tampering_detected &&
              !forgeryResult.jpeg_anomaly &&
              !forgeryResult.lighting_anomaly &&
              !forgeryResult.noise_anomaly;

            return (
              <div className="analysis-results">
                <h3>Forensic Forgery Analysis Results</h3>
                <div className="forgery-result-container">
                  <div className="forgery-status">
                    <h4>Analysis Verdict:</h4>
                    <div
                      className={`forgery-label ${
                        imageAuthentic ? "authentic" : "tampered"
                      }`}
                    >
                      {imageAuthentic
                        ? "No Tampering Detected"
                        : "Possible Tampering Detected"}
                    </div>
                  </div>

                  <div className="forgery-details">
                    <h4>Detailed Analysis:</h4>
                    <ul className="forgery-checks-list">
                      <li
                        className={`forgery-check-item ${
                          forgeryResult.tampering_detected ? "failed" : "passed"
                        }`}
                      >
                        <span className="check-icon">
                          {forgeryResult.tampering_detected ? "❌" : "✅"}
                        </span>
                        <div className="check-details">
                          <span className="check-name">
                            General Tampering Check
                          </span>
                          <span className="check-result">
                            {forgeryResult.tampering_detected
                              ? "Tampering indicators found"
                              : "No tampering detected"}
                          </span>
                        </div>
                      </li>

                      <li
                        className={`forgery-check-item ${
                          forgeryResult.jpeg_anomaly ? "failed" : "passed"
                        }`}
                      >
                        <span className="check-icon">
                          {forgeryResult.jpeg_anomaly ? "❌" : "✅"}
                        </span>
                        <div className="check-details">
                          <span className="check-name">
                            JPEG Compression Analysis
                          </span>
                          <span className="check-result">
                            {forgeryResult.jpeg_anomaly
                              ? "Inconsistent compression detected"
                              : "Normal compression patterns"}
                          </span>
                        </div>
                      </li>

                      <li
                        className={`forgery-check-item ${
                          forgeryResult.lighting_anomaly ? "failed" : "passed"
                        }`}
                      >
                        <span className="check-icon">
                          {forgeryResult.lighting_anomaly ? "❌" : "✅"}
                        </span>
                        <div className="check-details">
                          <span className="check-name">
                            Lighting Consistency
                          </span>
                          <span className="check-result">
                            {forgeryResult.lighting_anomaly
                              ? "Inconsistent lighting detected"
                              : "Consistent lighting throughout image"}
                          </span>
                        </div>
                      </li>

                      <li
                        className={`forgery-check-item ${
                          forgeryResult.noise_anomaly ? "failed" : "passed"
                        }`}
                      >
                        <span className="check-icon">
                          {forgeryResult.noise_anomaly ? "❌" : "✅"}
                        </span>
                        <div className="check-details">
                          <span className="check-name">
                            Noise Pattern Analysis
                          </span>
                          <span className="check-result">
                            {forgeryResult.noise_anomaly
                              ? "Inconsistent noise patterns detected"
                              : "Consistent noise patterns throughout"}
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="result-explanation">
                    <p>
                      <strong>How to interpret:</strong> Our forensic analysis
                      examines various aspects of the image to detect signs of
                      manipulation. Each check looks for specific types of
                      inconsistencies that may indicate tampering.
                    </p>
                    <p>
                      Green checkmarks (✅) indicate that the check passed,
                      while red X marks (❌) indicate potential tampering. The
                      analysis is based on forensic image analysis techniques
                      and may require expert verification.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          break;

        default:
          return null;
      }
    }
    // Return the TextAnalysis component
    else if (analysisType === "text") {
      // Return the TextAnalysis component with all necessary props
      return (
        <TextAnalysis selectedImage={selectedImage} previewUrl={previewUrl} />
      );
    }

    return null;
  };

  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);

    // If we're showing the history panel, scroll to it after state update
    if (newShowHistory) {
      // Use setTimeout to ensure the DOM has updated before scrolling
      setTimeout(() => {
        if (historyPanelRef.current) {
          historyPanelRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  };

  return (
    <div className="image-analysis-container">
      <h2>Image Forensic Analysis</h2>

      <div className="analysis-type-selector">
        <div className="radio-group">
          <label className="radio-container">
            <input
              type="radio"
              value="image"
              checked={analysisType === "image"}
              onChange={handleAnalysisTypeChange}
            />
            <span className="radio-label">Image Analysis</span>
          </label>
          <label className="radio-container">
            <input
              type="radio"
              value="text"
              checked={analysisType === "text"}
              onChange={handleAnalysisTypeChange}
            />
            <span className="radio-label">Text Analysis</span>
          </label>
        </div>
      </div>

      {analysisType === "image" && (
        <div className="analysis-content">
          <div className="file-upload-section">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            <div className="upload-area" onClick={triggerFileInput}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Selected"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">
                  <i className="upload-icon">📁</i>
                  <p>Click to upload an image for analysis</p>
                </div>
              )}
            </div>
            <div className="file-actions">
              <button
                className="select-file-btn"
                onClick={triggerFileInput}
                disabled={isProcessing}
              >
                {selectedImage ? "Change Image" : "Select Image"}
              </button>
              {selectedImage && (
                <button
                  className="reset-btn"
                  onClick={resetAll}
                  disabled={isProcessing}
                >
                  Reset
                </button>
              )}
              <button
                className="history-btn"
                onClick={toggleHistory}
                disabled={isProcessing}
              >
                {showHistory ? "Hide History" : "View History"}
              </button>
              <button
                className="delete-history-btn"
                onClick={() => {
                  // Add confirmation dialog here
                  if (
                    window.confirm(
                      "Are you sure you want to delete all analysis history? This cannot be undone."
                    )
                  ) {
                    deleteAllAnalyses();
                  }
                }}
              >
                <i className="trash-icon">🗑️</i> Delete History
              </button>
            </div>
          </div>

          {selectedImage && (
            <div className="analysis-options">
              <h3>Select Analysis Method</h3>
              <div className="analysis-buttons">
                <button
                  className={`analysis-btn ${
                    analysisSubType === "error-level" ? "selected" : ""
                  }`}
                  onClick={() => handleAnalysisSubTypeChange("error-level")}
                  disabled={isProcessing}
                >
                  Error Level Analysis
                </button>
                <button
                  className={`analysis-btn ${
                    analysisSubType === "clone-detection" ? "selected" : ""
                  }`}
                  onClick={() => handleAnalysisSubTypeChange("clone-detection")}
                  disabled={isProcessing}
                >
                  Clone Detection
                </button>
                <button
                  className={`analysis-btn ${
                    analysisSubType === "deepfake" ? "selected" : ""
                  }`}
                  onClick={() => handleAnalysisSubTypeChange("deepfake")}
                  disabled={isProcessing}
                >
                  Deepfake Detection
                </button>
                <button
                  className={`analysis-btn ${
                    analysisSubType === "anomaly" ? "selected" : ""
                  }`}
                  onClick={() => handleAnalysisSubTypeChange("anomaly")}
                  disabled={isProcessing}
                >
                  Anomaly Detection
                </button>
                <button
                  className={`analysis-btn ${
                    analysisSubType === "forgery" ? "selected" : ""
                  }`}
                  onClick={() => handleAnalysisSubTypeChange("forgery")}
                  disabled={isProcessing}
                >
                  Forensic Analysis
                </button>
              </div>

              {analysisSubType && (
                <button
                  className="analyze-btn"
                  onClick={handleImageAnalysis}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Analyze Image"}
                </button>
              )}

              {processingStatus && (
                <div
                  className={`status-message ${
                    processingStatus.success ? "success" : "error"
                  }`}
                >
                  {processingStatus.message}
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {/* {renderResults()} */}

          <div ref={resultsRef}>{renderResults()}</div>

          {/* History Panel */}
          {showHistory && (
            <div className="history-panel" ref={historyPanelRef}>
              <h3>Analysis History</h3>
              {savedAnalyses.length === 0 ? (
                <p>No saved analyses found.</p>
              ) : (
                <ul className="history-list">
                  {savedAnalyses.map((analysis) => (
                    <li
                      key={analysis._id}
                      className="history-item"
                      onClick={() => loadAnalysis(analysis)}
                    >
                      <div className="history-item-details">
                        <span className="history-item-name">
                          {analysis.fileName || "Unnamed Analysis"}
                        </span>
                        <span className="history-item-type">
                          {analysis.analysisSubtype
                            ? analysis.analysisSubtype
                                .split("-")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")
                            : "Unknown Analysis"}
                        </span>
                        <span className="history-item-date">
                          {formatDate(analysis.createdAt)}
                        </span>
                      </div>
                      <button
                        className="delete-history-btn"
                        onClick={(e) => deleteAnalysis(analysis._id, e)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text Analysis section - properly rendering the component when 'text' is selected */}
      {analysisType === "text" && (
        <TextAnalysis
          selectedImage={selectedImage}
          previewUrl={previewUrl}
          triggerFileInput={triggerFileInput}
          handleFileChange={handleFileChange}
          fileInputRef={fileInputRef}
          showHistory={showHistory}
          toggleHistory={toggleHistory}
          deleteAllAnalyses={deleteAllAnalyses}
          historyPanelRef={historyPanelRef}
          onReset={resetImageSelection}
        />
      )}
    </div>
  );
};

export default ImageAnalysis;
