// import { useState, useRef } from "react";
// import "./ImageAnalysis.css";

// const UnifiedAnalysis = () => {
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processingStatus, setProcessingStatus] = useState(null);
//   const [analysisType, setAnalysisType] = useState("image"); // 'image' or 'text'

//   // Image analysis states
//   const [analysisResultImage, setAnalysisResultImage] = useState(null);
//   const [deepfakeResult, setDeepfakeResult] = useState(null);
//   const [anomalyResult, setAnomalyResult] = useState(null);
//   const [forgeryResult, setForgeryResult] = useState(null);

//   // Text analysis states
//   const [extractedText, setExtractedText] = useState("");
//   const [parsedData, setParsedData] = useState(null);
//   const [textAnalysisResults, setTextAnalysisResults] = useState(null);

//   // Processing status tracking
//   const [processingStep, setProcessingStep] = useState(null);
//   const [processingSummary, setProcessingSummary] = useState([]);

//   const fileInputRef = useRef(null);

//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     // Validate file is an image
//     if (!file.type.match("image.*")) {
//       setProcessingStatus({
//         success: false,
//         message: "Please select an image file",
//       });
//       return;
//     }

//     setSelectedImage(file);

//     // Create preview URL
//     const reader = new FileReader();
//     reader.onload = () => {
//       setPreviewUrl(reader.result);
//     };
//     reader.readAsDataURL(file);

//     // Reset all previous results
//     resetResults();
//   };

//   const resetResults = () => {
//     // Reset status and results
//     setProcessingStatus(null);
//     setAnalysisResultImage(null);
//     setDeepfakeResult(null);
//     setAnomalyResult(null);
//     setForgeryResult(null);
//     setExtractedText("");
//     setParsedData(null);
//     setTextAnalysisResults(null);
//     setProcessingSummary([]);
//   };

//   const handleAnalysisTypeChange = (e) => {
//     setAnalysisType(e.target.value);
//     resetResults();
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current.click();
//   };

//   const resetAll = () => {
//     setSelectedImage(null);
//     setPreviewUrl(null);
//     resetResults();
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   // The main unified analysis function that runs all analyses sequentially
//   const runUnifiedAnalysis = async () => {
//     if (!selectedImage) {
//       setProcessingStatus({
//         success: false,
//         message: "Please select an image first",
//       });
//       return;
//     }

//     setIsProcessing(true);
//     resetResults();
//     setProcessingSummary([]);

//     try {
//       // Step 1: Run the appropriate analysis based on type
//       if (analysisType === "image") {
//         await runCompleteImageAnalysis();
//       } else {
//         await runCompleteTextAnalysis();
//       }

//       // Final status update
//       setProcessingStatus({
//         success: true,
//         message: "All analyses completed successfully!",
//       });
//     } catch (error) {
//       console.error("Error during unified analysis:", error);
//       setProcessingStatus({
//         success: false,
//         message: `Analysis failed: ${error.message}`,
//       });
//     } finally {
//       setIsProcessing(false);
//       setProcessingStep(null);
//     }
//   };

//   // Run all image analysis methods sequentially
//   const runCompleteImageAnalysis = async () => {
//     const analysisSubTypes = [
//       { id: "error-level", label: "Error Level Analysis" },
//       { id: "clone-detection", label: "Clone Detection" },
//       { id: "deepfake", label: "Deepfake Detection" },
//       { id: "anomaly", label: "Anomaly Detection" },
//       { id: "forgery", label: "Forgery Detection" },
//     ];

//     for (const analysis of analysisSubTypes) {
//       setProcessingStep(analysis.id);
//       setProcessingStatus({
//         success: true,
//         message: `Running ${analysis.label}...`,
//       });

//       try {
//         const result = await performSingleImageAnalysis(analysis.id);
//         setProcessingSummary((prev) => [
//           ...prev,
//           {
//             type: analysis.id,
//             label: analysis.label,
//             status: "completed",
//             result: result,
//           },
//         ]);
//       } catch (error) {
//         console.error(`Error in ${analysis.label}:`, error);
//         setProcessingSummary((prev) => [
//           ...prev,
//           {
//             type: analysis.id,
//             label: analysis.label,
//             status: "failed",
//             error: error.message,
//           },
//         ]);
//       }
//     }
//   };

//   // Perform a single image analysis
//   const performSingleImageAnalysis = async (analysisSubType) => {
//     // Create FormData for file upload
//     const formData = new FormData();
//     formData.append("image", selectedImage);

//     // Different endpoints based on analysis subtype
//     let endpoint;
//     switch (analysisSubType) {
//       case "error-level":
//         endpoint = "http://127.0.0.1:5000/api/analyze-and-visualize";
//         break;
//       case "clone-detection":
//         endpoint = "http://127.0.0.1:5000/api/clone-detection";
//         break;
//       case "deepfake":
//         endpoint = "http://127.0.0.1:5000/api/deepfake-detection";
//         break;
//       case "anomaly":
//         endpoint = "http://127.0.0.1:5000/api/anomaly-detection";
//         break;
//       case "forgery":
//         endpoint = "http://127.0.0.1:5000/api/forgery-detection";
//         break;
//       default:
//         endpoint = "http://127.0.0.1:5000/api/analyze-and-visualize";
//         break;
//     }

//     const response = await fetch(endpoint, {
//       method: "POST",
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`Analysis failed: ${response.status}`);
//     }

//     // Handle different response types based on the analysis subtype
//     if (
//       analysisSubType === "error-level" ||
//       analysisSubType === "clone-detection"
//     ) {
//       // Handle image blob responses
//       const blob = await response.blob();
//       const imageUrl = URL.createObjectURL(blob);
//       setAnalysisResultImage((prevState) => ({
//         ...prevState,
//         [analysisSubType]: imageUrl,
//       }));
//       return { type: "image", url: imageUrl };
//     } else if (analysisSubType === "deepfake") {
//       // Handle JSON response for deepfake detection
//       const jsonData = await response.json();
//       setDeepfakeResult(jsonData);
//       return jsonData;
//     } else if (analysisSubType === "anomaly") {
//       // Handle JSON response for anomaly detection
//       const jsonData = await response.json();
//       setAnomalyResult(jsonData);
//       return jsonData;
//     } else if (analysisSubType === "forgery") {
//       // Handle JSON response for forgery detection
//       const jsonData = await response.json();
//       setForgeryResult(jsonData);
//       return jsonData;
//     }
//   };

//   // Run complete text analysis
//   const runCompleteTextAnalysis = async () => {
//     // Step 1: Extract and Parse Text
//     setProcessingStep("extractParse");
//     setProcessingStatus({
//       success: true,
//       message: "Extracting and parsing text...",
//     });

//     try {
//       // Create FormData for file upload
//       const formData = new FormData();
//       formData.append("image", selectedImage);

//       const extractParseResponse = await fetch(
//         "http://127.0.0.1:5000/api/parse-receipt",
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       if (!extractParseResponse.ok) {
//         throw new Error(
//           `Text extraction and parsing failed: ${extractParseResponse.status}`
//         );
//       }

//       const result = await extractParseResponse.json();
//       setExtractedText(result.text);
//       setParsedData(result.parsedData);

//       setProcessingSummary((prev) => [
//         ...prev,
//         {
//           type: "text-extraction",
//           label: "Text Extraction & Parsing",
//           status: "completed",
//           result: {
//             text: result.text.substring(0, 100) + "...", // Preview
//             parsedItems: Object.keys(result.parsedData).length,
//           },
//         },
//       ]);

//       // Step 2: Analyze for tampering
//       setProcessingStep("analyzing");
//       setProcessingStatus({
//         success: true,
//         message: "Analyzing text for tampering...",
//       });

//       const requestData = {
//         parsedData: result.parsedData,
//         originalText: result.text,
//         imageMetadata: {}, // You could add image metadata if available
//       };

//       const tamperingResponse = await fetch(
//         "http://127.0.0.1:5000/api/analyze-receipt",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(requestData),
//         }
//       );

//       if (!tamperingResponse.ok) {
//         throw new Error(
//           `Tampering analysis failed: ${tamperingResponse.status}`
//         );
//       }

//       const tamperingResult = await tamperingResponse.json();
//       setTextAnalysisResults(tamperingResult);

//       setProcessingSummary((prev) => [
//         ...prev,
//         {
//           type: "text-analysis",
//           label: "Text Tampering Analysis",
//           status: "completed",
//           result: tamperingResult,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error during text analysis:", error);
//       setProcessingSummary((prev) => [
//         ...prev,
//         {
//           type:
//             processingStep === "extractParse"
//               ? "text-extraction"
//               : "text-analysis",
//           label:
//             processingStep === "extractParse"
//               ? "Text Extraction & Parsing"
//               : "Text Tampering Analysis",
//           status: "failed",
//           error: error.message,
//         },
//       ]);
//       throw error;
//     }
//   };

//   // Calculate confidence level display properties for deepfake results
//   const getConfidenceBarStyle = (confidence) => {
//     // Define color based on confidence level
//     let color;
//     if (confidence < 0.4) color = "#4CAF50"; // Green for likely real
//     else if (confidence < 0.6) color = "#FF9800"; // Orange for uncertain
//     else color = "#F44336"; // Red for likely fake

//     return {
//       width: `${confidence * 100}%`,
//       backgroundColor: color,
//     };
//   };

//   // Render progress indicator for all analyses
//   const renderProgressIndicator = () => {
//     if (!isProcessing && processingSummary.length === 0) return null;

//     let steps = [];
//     if (analysisType === "image") {
//       steps = [
//         { id: "error-level", label: "Error Level Analysis" },
//         { id: "clone-detection", label: "Clone Detection" },
//         { id: "deepfake", label: "Deepfake Detection" },
//         { id: "anomaly", label: "Anomaly Detection" },
//         { id: "forgery", label: "Forgery Detection" },
//       ];
//     } else {
//       steps = [
//         { id: "extractParse", label: "Extract & Parse" },
//         { id: "analyzing", label: "Text Analysis" },
//       ];
//     }

//     // Find current step index
//     const currentStepIndex = steps.findIndex(
//       (step) => step.id === processingStep
//     );

//     return (
//       <div className="progress-indicator">
//         {steps.map((step, index) => {
//           const summaryItem = processingSummary.find((s) => s.type === step.id);
//           let status = "";

//           if (summaryItem) {
//             status =
//               summaryItem.status === "completed" ? "completed" : "failed";
//           } else if (processingStep === step.id) {
//             status = "active";
//           } else if (index < currentStepIndex) {
//             status = "completed";
//           }

//           return (
//             <div key={step.id} className={`progress-step ${status}`}>
//               <div className="step-number">{index + 1}</div>
//               <div className="step-label">{step.label}</div>
//               {status === "completed" && <span className="status-icon">✓</span>}
//               {status === "failed" && <span className="status-icon">✗</span>}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   // Render the unified results summary
//   const renderUnifiedResults = () => {
//     if (isProcessing || processingSummary.length === 0) return null;

//     if (analysisType === "image") {
//       return renderImageAnalysisSummary();
//     } else {
//       return renderTextAnalysisSummary();
//     }
//   };

//   // Render image analysis summary
//   const renderImageAnalysisSummary = () => {
//     // Create a summary object to track overall findings
//     const findings = {
//       suspicious: 0,
//       possibleTampering: false,
//       deepfakeConfidence: deepfakeResult?.confidence || 0,
//       anomalyCount: anomalyResult?.summary?.length || 0,
//       forgeryIssues: 0,
//     };

//     // Calculate forgery issues
//     if (forgeryResult) {
//       if (forgeryResult.tampering_detected) findings.forgeryIssues++;
//       if (forgeryResult.jpeg_anomaly) findings.forgeryIssues++;
//       if (forgeryResult.lighting_anomaly) findings.forgeryIssues++;
//       if (forgeryResult.noise_anomaly) findings.forgeryIssues++;
//     }

//     // Determine overall assessment
//     findings.possibleTampering =
//       deepfakeResult?.label === "Deepfake" ||
//       findings.anomalyCount > 0 ||
//       findings.forgeryIssues > 0;

//     // Count total suspicious indicators
//     findings.suspicious =
//       (deepfakeResult?.label === "Deepfake" ? 1 : 0) +
//       findings.anomalyCount +
//       findings.forgeryIssues;

//     // Overall status
//     const overallRiskLevel =
//       findings.suspicious === 0
//         ? "low"
//         : findings.suspicious < 3
//         ? "medium"
//         : "high";

//     return (
//       <div className="unified-results">
//         <h3>Comprehensive Image Analysis Results</h3>

//         <div className={`overall-assessment ${overallRiskLevel}`}>
//           <h4>Overall Assessment</h4>
//           <div className="assessment-verdict">
//             {overallRiskLevel === "low"
//               ? "No Suspicious Patterns Detected"
//               : overallRiskLevel === "medium"
//               ? "Some Suspicious Patterns Detected"
//               : "High Likelihood of Image Manipulation"}
//           </div>
//           <div className="risk-meter">
//             <div className={`risk-level ${overallRiskLevel}`}>
//               {overallRiskLevel.toUpperCase()} RISK
//             </div>
//           </div>
//         </div>

//         <div className="findings-summary">
//           <h4>Key Findings Summary</h4>
//           <ul className="findings-list">
//             <li
//               className={
//                 deepfakeResult?.label === "Deepfake" ? "suspicious" : "normal"
//               }
//             >
//               <span className="finding-icon">
//                 {deepfakeResult?.label === "Deepfake" ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Deepfake Detection:</span>
//               <span className="finding-result">
//                 {deepfakeResult
//                   ? `${deepfakeResult.label} (${(
//                       deepfakeResult.confidence * 100
//                     ).toFixed(1)}% confidence)`
//                   : "Analysis not completed"}
//               </span>
//             </li>

//             <li className={findings.anomalyCount > 0 ? "suspicious" : "normal"}>
//               <span className="finding-icon">
//                 {findings.anomalyCount > 0 ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Image Anomalies:</span>
//               <span className="finding-result">
//                 {anomalyResult
//                   ? `${findings.anomalyCount} suspicious patterns detected`
//                   : "Analysis not completed"}
//               </span>
//             </li>

//             <li
//               className={findings.forgeryIssues > 0 ? "suspicious" : "normal"}
//             >
//               <span className="finding-icon">
//                 {findings.forgeryIssues > 0 ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Forensic Analysis:</span>
//               <span className="finding-result">
//                 {forgeryResult
//                   ? `${findings.forgeryIssues} forensic inconsistencies found`
//                   : "Analysis not completed"}
//               </span>
//             </li>
//           </ul>
//         </div>

//         {/* Show view details button that could expand to show all detailed results */}
//         {/* <button className="view-details-button">View Detailed Results</button> */}
//       </div>
//     );
//   };

//   // Render text analysis summary
//   const renderTextAnalysisSummary = () => {
//     if (!textAnalysisResults) return null;

//     const suspiciousFieldCount =
//       textAnalysisResults.suspiciousFields?.length || 0;
//     const inconsistencyCount = textAnalysisResults.inconsistencies?.length || 0;

//     // Calculate risk level
//     const isManipulated = textAnalysisResults.isManipulated;
//     const manipulationProbability =
//       textAnalysisResults.manipulationProbability || 0;

//     let riskLevel = "low";
//     if (isManipulated || manipulationProbability > 0.7) {
//       riskLevel = "high";
//     } else if (
//       suspiciousFieldCount > 0 ||
//       inconsistencyCount > 0 ||
//       manipulationProbability > 0.3
//     ) {
//       riskLevel = "medium";
//     }

//     return (
//       <div className="unified-results">
//         <h3>Comprehensive Document Analysis Results</h3>

//         <div className={`overall-assessment ${riskLevel}`}>
//           <h4>Overall Assessment</h4>
//           <div className="assessment-verdict">
//             {riskLevel === "low"
//               ? "No Text Manipulation Detected"
//               : riskLevel === "medium"
//               ? "Possible Text Manipulation"
//               : "High Likelihood of Text Manipulation"}
//           </div>
//           <div className="risk-meter">
//             <div className={`risk-level ${riskLevel}`}>
//               {riskLevel.toUpperCase()} RISK
//             </div>
//           </div>
//         </div>

//         <div className="findings-summary">
//           <h4>Key Findings Summary</h4>

//           <div className="text-analysis-stats">
//             <div className="stat-item">
//               <div className="stat-label">Extracted Text</div>
//               <div className="stat-value">
//                 {extractedText
//                   ? `${extractedText.split(" ").length} words`
//                   : "None"}
//               </div>
//             </div>

//             <div className="stat-item">
//               <div className="stat-label">Parsed Fields</div>
//               <div className="stat-value">
//                 {parsedData ? Object.keys(parsedData).length : 0}
//               </div>
//             </div>

//             <div className="stat-item">
//               <div className="stat-label">Manipulation Probability</div>
//               <div className="stat-value">
//                 {textAnalysisResults
//                   ? `${(
//                       textAnalysisResults.manipulationProbability * 100
//                     ).toFixed(1)}%`
//                   : "Unknown"}
//               </div>
//             </div>
//           </div>

//           <ul className="findings-list">
//             <li className={suspiciousFieldCount > 0 ? "suspicious" : "normal"}>
//               <span className="finding-icon">
//                 {suspiciousFieldCount > 0 ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Suspicious Fields:</span>
//               <span className="finding-result">
//                 {suspiciousFieldCount} detected
//               </span>
//             </li>

//             <li className={inconsistencyCount > 0 ? "suspicious" : "normal"}>
//               <span className="finding-icon">
//                 {inconsistencyCount > 0 ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Logical Inconsistencies:</span>
//               <span className="finding-result">
//                 {inconsistencyCount} detected
//               </span>
//             </li>

//             <li
//               className={
//                 textAnalysisResults.manipulationType ? "suspicious" : "normal"
//               }
//             >
//               <span className="finding-icon">
//                 {textAnalysisResults.manipulationType ? "⚠️" : "✓"}
//               </span>
//               <span className="finding-name">Manipulation Type:</span>
//               <span className="finding-result">
//                 {textAnalysisResults.manipulationType || "None detected"}
//               </span>
//             </li>
//           </ul>
//         </div>

//         {/* Show view details button that could expand to show all detailed results */}
//         <button className="view-details-button">View Detailed Results</button>
//       </div>
//     );
//   };

//   return (
//     <div className="unified-analysis-container">
//       <h2>Advanced Media Analysis Tool</h2>

//       <div className="upload-area">
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           accept="image/*"
//           className="file-input"
//         />

//         <div className="control-buttons">
//           <button
//             type="button"
//             onClick={triggerFileInput}
//             className="primary-button"
//           >
//             Select Image
//           </button>

//           {previewUrl && (
//             <button
//               type="button"
//               onClick={resetAll}
//               className="secondary-button danger"
//             >
//               Remove
//             </button>
//           )}
//         </div>

//         {previewUrl && (
//           <div className="preview-container">
//             <img src={previewUrl} alt="Preview" className="image-preview" />

//             {selectedImage && (
//               <div className="file-info">
//                 <p>File: {selectedImage.name}</p>
//                 <p>Size: {(selectedImage.size / 1024).toFixed(2)} KB</p>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Analysis type selection */}
//         {selectedImage && (
//           <div className="analysis-options">
//             <h3>Select Analysis Type</h3>

//             <div className="radio-group">
//               <div className="radio-option">
//                 <input
//                   type="radio"
//                   id="image-analysis"
//                   name="analysis-type"
//                   value="image"
//                   checked={analysisType === "image"}
//                   onChange={handleAnalysisTypeChange}
//                 />
//                 <label htmlFor="image-analysis">
//                   Image Tampering Detection
//                 </label>
//               </div>

//               <div className="radio-option">
//                 <input
//                   type="radio"
//                   id="text-analysis"
//                   name="analysis-type"
//                   value="text"
//                   checked={analysisType === "text"}
//                   onChange={handleAnalysisTypeChange}
//                 />
//                 <label htmlFor="text-analysis">
//                   Text Extraction & Tampering Detection
//                 </label>
//               </div>
//             </div>

//             {/* Unified run button */}
//             <button
//               type="button"
//               onClick={runUnifiedAnalysis}
//               disabled={!selectedImage || isProcessing}
//               className="primary-button accent full-width-button"
//             >
//               {isProcessing
//                 ? "Analyzing... Please Wait"
//                 : `Run Complete ${
//                     analysisType === "image" ? "Image" : "Document"
//                   } Analysis`}
//             </button>
//           </div>
//         )}

//         {/* Progress indicator */}
//         {renderProgressIndicator()}

//         {/* Status messages */}
//         {processingStatus && (
//           <div
//             className={`status-message ${
//               processingStatus.success ? "success" : "error"
//             }`}
//           >
//             <p>{processingStatus.message}</p>
//           </div>
//         )}
//       </div>

//       {/* Unified results summary */}
//       {renderUnifiedResults()}
//     </div>
//   );
// };

// export default UnifiedAnalysis;

import { useState, useRef } from "react";
import "./ImageAnalysis.css";

const UnifiedAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [analysisType, setAnalysisType] = useState("image"); // 'image' or 'text'

  // Image analysis states
  const [analysisResultImage, setAnalysisResultImage] = useState(null);
  const [deepfakeResult, setDeepfakeResult] = useState(null);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [forgeryResult, setForgeryResult] = useState(null);

  // Text analysis states
  const [extractedText, setExtractedText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [textAnalysisResults, setTextAnalysisResults] = useState(null);

  // Processing status tracking
  const [processingStep, setProcessingStep] = useState(null);
  const [processingSummary, setProcessingSummary] = useState([]);

  const fileInputRef = useRef(null);

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

    // Reset all previous results
    resetResults();
  };

  const resetResults = () => {
    // Reset status and results
    setProcessingStatus(null);
    setAnalysisResultImage(null);
    setDeepfakeResult(null);
    setAnomalyResult(null);
    setForgeryResult(null);
    setExtractedText("");
    setParsedData(null);
    setTextAnalysisResults(null);
    setProcessingSummary([]);
  };

  const handleAnalysisTypeChange = (e) => {
    setAnalysisType(e.target.value);
    resetResults();
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetAll = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    resetResults();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // The main unified analysis function that runs all analyses sequentially
  const runUnifiedAnalysis = async () => {
    if (!selectedImage) {
      setProcessingStatus({
        success: false,
        message: "Please select an image first",
      });
      return;
    }

    setIsProcessing(true);
    resetResults();
    setProcessingSummary([]);

    try {
      // Step 1: Run the appropriate analysis based on type
      if (analysisType === "image") {
        await runCompleteImageAnalysis();
      } else {
        await runCompleteTextAnalysis();
      }

      // Final status update
      setProcessingStatus({
        success: true,
        message: "All analyses completed successfully!",
      });
    } catch (error) {
      console.error("Error during unified analysis:", error);
      setProcessingStatus({
        success: false,
        message: `Analysis failed: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  // Run all image analysis methods sequentially
  const runCompleteImageAnalysis = async () => {
    const analysisSubTypes = [
      { id: "error-level", label: "Error Level Analysis" },
      { id: "clone-detection", label: "Clone Detection" },
      { id: "deepfake", label: "Deepfake Detection" },
      { id: "anomaly", label: "Anomaly Detection" },
      { id: "forgery", label: "Forgery Detection" },
    ];

    for (const analysis of analysisSubTypes) {
      setProcessingStep(analysis.id);
      setProcessingStatus({
        success: true,
        message: `Running ${analysis.label}...`,
      });

      try {
        const result = await performSingleImageAnalysis(analysis.id);
        setProcessingSummary((prev) => [
          ...prev,
          {
            type: analysis.id,
            label: analysis.label,
            status: "completed",
            result: result,
          },
        ]);
      } catch (error) {
        console.error(`Error in ${analysis.label}:`, error);
        setProcessingSummary((prev) => [
          ...prev,
          {
            type: analysis.id,
            label: analysis.label,
            status: "failed",
            error: error.message,
          },
        ]);
      }
    }
  };

  // Perform a single image analysis
  const performSingleImageAnalysis = async (analysisSubType) => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("image", selectedImage);

    // Different endpoints based on analysis subtype
    let endpoint;
    switch (analysisSubType) {
      case "error-level":
        endpoint = "http://127.0.0.1:5000/api/analyze-and-visualize";
        break;
      case "clone-detection":
        endpoint = "http://127.0.0.1:5000/api/clone-detection";
        break;
      case "deepfake":
        endpoint = "http://127.0.0.1:5000/api/deepfake-detection";
        break;
      case "anomaly":
        endpoint = "http://127.0.0.1:5000/api/anomaly-detection";
        break;
      case "forgery":
        endpoint = "http://127.0.0.1:5000/api/forgery-detection";
        break;
      default:
        endpoint = "http://127.0.0.1:5000/api/analyze-and-visualize";
        break;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    // Handle different response types based on the analysis subtype
    if (
      analysisSubType === "error-level" ||
      analysisSubType === "clone-detection"
    ) {
      // Handle image blob responses
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setAnalysisResultImage((prevState) => ({
        ...prevState,
        [analysisSubType]: imageUrl,
      }));
      return { type: "image", url: imageUrl };
    } else if (analysisSubType === "deepfake") {
      // Handle JSON response for deepfake detection
      const jsonData = await response.json();
      setDeepfakeResult(jsonData);
      return jsonData;
    } else if (analysisSubType === "anomaly") {
      // Handle JSON response for anomaly detection
      const jsonData = await response.json();
      setAnomalyResult(jsonData);
      return jsonData;
    } else if (analysisSubType === "forgery") {
      // Handle JSON response for forgery detection
      const jsonData = await response.json();
      setForgeryResult(jsonData);
      return jsonData;
    }
  };

  // Run complete text analysis
  const runCompleteTextAnalysis = async () => {
    // Step 1: Extract and Parse Text
    setProcessingStep("extractParse");
    setProcessingStatus({
      success: true,
      message: "Extracting and parsing text...",
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", selectedImage);

      const extractParseResponse = await fetch(
        "http://127.0.0.1:5000/api/parse-receipt",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!extractParseResponse.ok) {
        throw new Error(
          `Text extraction and parsing failed: ${extractParseResponse.status}`
        );
      }

      const result = await extractParseResponse.json();
      setExtractedText(result.text || "");
      setParsedData(result.parsedData || {});

      // Fix: Handle potentially undefined text
      const textPreview = result.text
        ? result.text.length > 100
          ? result.text.substring(0, 100) + "..."
          : result.text
        : "No text extracted";

      console.log(textPreview);

      setProcessingSummary((prev) => [
        ...prev,
        {
          type: "text-extraction",
          label: "Text Extraction & Parsing",
          status: "completed",
          result: {
            text: textPreview,
            parsedItems: Object.keys(result.parsedData || {}).length,
          },
        },
      ]);

      // Step 2: Analyze for tampering
      setProcessingStep("analyzing");
      setProcessingStatus({
        success: true,
        message: "Analyzing text for tampering...",
      });

      const requestData = {
        parsedData: result.parsedData || {},
        originalText: result.text || "",
        imageMetadata: {}, // You could add image metadata if available
      };

      const tamperingResponse = await fetch(
        "http://127.0.0.1:5000/api/analyze-receipt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!tamperingResponse.ok) {
        throw new Error(
          `Tampering analysis failed: ${tamperingResponse.status}`
        );
      }

      const tamperingResult = await tamperingResponse.json();
      setTextAnalysisResults(tamperingResult);

      setProcessingSummary((prev) => [
        ...prev,
        {
          type: "text-analysis",
          label: "Text Tampering Analysis",
          status: "completed",
          result: tamperingResult,
        },
      ]);
    } catch (error) {
      console.error("Error during text analysis:", error);
      setProcessingSummary((prev) => [
        ...prev,
        {
          type:
            processingStep === "extractParse"
              ? "text-extraction"
              : "text-analysis",
          label:
            processingStep === "extractParse"
              ? "Text Extraction & Parsing"
              : "Text Tampering Analysis",
          status: "failed",
          error: error.message,
        },
      ]);
      throw error;
    }
  };

  // Calculate confidence level display properties for deepfake results
  const getConfidenceBarStyle = (confidence) => {
    // Define color based on confidence level
    let color;
    if (confidence < 0.4) color = "#4CAF50"; // Green for likely real
    else if (confidence < 0.6) color = "#FF9800"; // Orange for uncertain
    else color = "#F44336"; // Red for likely fake

    return {
      width: `${confidence * 100}%`,
      backgroundColor: color,
    };
  };

  // Render progress indicator for all analyses
  const renderProgressIndicator = () => {
    if (!isProcessing && processingSummary.length === 0) return null;

    let steps = [];
    if (analysisType === "image") {
      steps = [
        { id: "error-level", label: "Error Level Analysis" },
        { id: "clone-detection", label: "Clone Detection" },
        { id: "deepfake", label: "Deepfake Detection" },
        { id: "anomaly", label: "Anomaly Detection" },
        { id: "forgery", label: "Forgery Detection" },
      ];
    } else {
      steps = [
        { id: "extractParse", label: "Extract & Parse" },
        { id: "analyzing", label: "Text Analysis" },
      ];
    }

    // Find current step index
    const currentStepIndex = steps.findIndex(
      (step) => step.id === processingStep
    );

    return (
      <div className="progress-indicator">
        {steps.map((step, index) => {
          const summaryItem = processingSummary.find((s) => s.type === step.id);
          let status = "";

          if (summaryItem) {
            status =
              summaryItem.status === "completed" ? "completed" : "failed";
          } else if (processingStep === step.id) {
            status = "active";
          } else if (index < currentStepIndex) {
            status = "completed";
          }

          return (
            <div key={step.id} className={`progress-step ${status}`}>
              <div className="step-number">{index + 1}</div>
              <div className="step-label">{step.label}</div>
              {status === "completed" && <span className="status-icon">✓</span>}
              {status === "failed" && <span className="status-icon">✗</span>}
            </div>
          );
        })}
      </div>
    );
  };

  // Render the unified results summary
  const renderUnifiedResults = () => {
    if (isProcessing || processingSummary.length === 0) return null;

    if (analysisType === "image") {
      return renderImageAnalysisSummary();
    } else {
      return renderTextAnalysisSummary();
    }
  };

  // Render image analysis summary
  const renderImageAnalysisSummary = () => {
    // Create a summary object to track overall findings
    const findings = {
      suspicious: 0,
      possibleTampering: false,
      deepfakeConfidence: deepfakeResult?.confidence || 0,
      anomalyCount: anomalyResult?.summary?.length || 0,
      forgeryIssues: 0,
    };

    // Calculate forgery issues
    if (forgeryResult) {
      if (forgeryResult.tampering_detected) findings.forgeryIssues++;
      if (forgeryResult.jpeg_anomaly) findings.forgeryIssues++;
      if (forgeryResult.lighting_anomaly) findings.forgeryIssues++;
      if (forgeryResult.noise_anomaly) findings.forgeryIssues++;
    }

    // Determine overall assessment
    findings.possibleTampering =
      deepfakeResult?.label === "Deepfake" ||
      findings.anomalyCount > 0 ||
      findings.forgeryIssues > 0;

    // Count total suspicious indicators
    findings.suspicious =
      (deepfakeResult?.label === "Deepfake" ? 1 : 0) +
      findings.anomalyCount +
      findings.forgeryIssues;

    // Overall status
    const overallRiskLevel =
      findings.suspicious === 0
        ? "low"
        : findings.suspicious < 3
        ? "medium"
        : "high";

    return (
      <div className="unified-results">
        <h3>Comprehensive Image Analysis Results</h3>

        <div className={`overall-assessment ${overallRiskLevel}`}>
          <h4>Overall Assessment</h4>
          <div className="assessment-verdict">
            {overallRiskLevel === "low"
              ? "No Suspicious Patterns Detected"
              : overallRiskLevel === "medium"
              ? "Some Suspicious Patterns Detected"
              : "High Likelihood of Image Manipulation"}
          </div>
          <div className="risk-meter">
            <div className={`risk-level ${overallRiskLevel}`}>
              {overallRiskLevel.toUpperCase()} RISK
            </div>
          </div>
        </div>

        <div className="findings-summary">
          <h4>Key Findings Summary</h4>
          <ul className="findings-list">
            <li
              className={
                deepfakeResult?.label === "Deepfake" ? "suspicious" : "normal"
              }
            >
              <span className="finding-icon">
                {deepfakeResult?.label === "Deepfake" ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Deepfake Detection:</span>
              <span className="finding-result">
                {deepfakeResult
                  ? `${deepfakeResult.label} (${(
                      deepfakeResult.confidence * 100
                    ).toFixed(1)}% confidence)`
                  : "Analysis not completed"}
              </span>
            </li>

            <li className={findings.anomalyCount > 0 ? "suspicious" : "normal"}>
              <span className="finding-icon">
                {findings.anomalyCount > 0 ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Image Anomalies:</span>
              <span className="finding-result">
                {anomalyResult
                  ? `${findings.anomalyCount} suspicious patterns detected`
                  : "Analysis not completed"}
              </span>
            </li>

            <li
              className={findings.forgeryIssues > 0 ? "suspicious" : "normal"}
            >
              <span className="finding-icon">
                {findings.forgeryIssues > 0 ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Forensic Analysis:</span>
              <span className="finding-result">
                {forgeryResult
                  ? `${findings.forgeryIssues} forensic inconsistencies found`
                  : "Analysis not completed"}
              </span>
            </li>
          </ul>
        </div>

        {/* Show view details button that could expand to show all detailed results */}
        <button className="view-details-button">View Detailed Results</button>
      </div>
    );
  };

  // Render text analysis summary
  const renderTextAnalysisSummary = () => {
    if (!textAnalysisResults) return null;

    const suspiciousFieldCount =
      textAnalysisResults.suspiciousFields?.length || 0;
    const inconsistencyCount = textAnalysisResults.inconsistencies?.length || 0;

    // Calculate risk level
    const isManipulated = textAnalysisResults.isManipulated;
    const manipulationProbability =
      textAnalysisResults.manipulationProbability || 0;

    let riskLevel = "low";
    if (isManipulated || manipulationProbability > 0.7) {
      riskLevel = "high";
    } else if (
      suspiciousFieldCount > 0 ||
      inconsistencyCount > 0 ||
      manipulationProbability > 0.3
    ) {
      riskLevel = "medium";
    }

    return (
      <div className="unified-results">
        <h3>Comprehensive Document Analysis Results</h3>

        <div className={`overall-assessment ${riskLevel}`}>
          <h4>Overall Assessment</h4>
          <div className="assessment-verdict">
            {riskLevel === "low"
              ? "No Text Manipulation Detected"
              : riskLevel === "medium"
              ? "Possible Text Manipulation"
              : "High Likelihood of Text Manipulation"}
          </div>
          <div className="risk-meter">
            <div className={`risk-level ${riskLevel}`}>
              {riskLevel.toUpperCase()} RISK
            </div>
          </div>
        </div>

        <div className="findings-summary">
          <h4>Key Findings Summary</h4>

          <div className="text-analysis-stats">
            <div className="stat-item">
              <div className="stat-label">Extracted Text</div>
              <div className="stat-value">
                {extractedText
                  ? `${extractedText.split(" ").length} words`
                  : "None"}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Parsed Fields</div>
              <div className="stat-value">
                {parsedData ? Object.keys(parsedData).length : 0}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Manipulation Probability</div>
              <div className="stat-value">
                {textAnalysisResults
                  ? `${(
                      textAnalysisResults.manipulationProbability * 100
                    ).toFixed(1)}%`
                  : "Unknown"}
              </div>
            </div>
          </div>

          <ul className="findings-list">
            <li className={suspiciousFieldCount > 0 ? "suspicious" : "normal"}>
              <span className="finding-icon">
                {suspiciousFieldCount > 0 ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Suspicious Fields:</span>
              <span className="finding-result">
                {suspiciousFieldCount} detected
              </span>
            </li>

            <li className={inconsistencyCount > 0 ? "suspicious" : "normal"}>
              <span className="finding-icon">
                {inconsistencyCount > 0 ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Logical Inconsistencies:</span>
              <span className="finding-result">
                {inconsistencyCount} detected
              </span>
            </li>

            <li
              className={
                textAnalysisResults.manipulationType ? "suspicious" : "normal"
              }
            >
              <span className="finding-icon">
                {textAnalysisResults.manipulationType ? "⚠️" : "✓"}
              </span>
              <span className="finding-name">Manipulation Type:</span>
              <span className="finding-result">
                {textAnalysisResults.manipulationType || "None detected"}
              </span>
            </li>
          </ul>
        </div>

        {/* Show view details button that could expand to show all detailed results */}
        <button className="view-details-button">View Detailed Results</button>
      </div>
    );
  };

  return (
    <div className="unified-analysis-container">
      <h2>Advanced Media Analysis Tool</h2>

      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="file-input"
        />

        <div className="control-buttons">
          <button
            type="button"
            onClick={triggerFileInput}
            className="primary-button"
          >
            Select Image
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={resetAll}
              className="secondary-button danger"
            >
              Remove
            </button>
          )}
        </div>

        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />

            {selectedImage && (
              <div className="file-info">
                <p>File: {selectedImage.name}</p>
                <p>Size: {(selectedImage.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>
        )}

        {/* Analysis type selection */}
        {selectedImage && (
          <div className="analysis-options">
            <h3>Select Analysis Type</h3>

            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="image-analysis"
                  name="analysis-type"
                  value="image"
                  checked={analysisType === "image"}
                  onChange={handleAnalysisTypeChange}
                />
                <label htmlFor="image-analysis">
                  Image Tampering Detection
                </label>
              </div>

              <div className="radio-option">
                <input
                  type="radio"
                  id="text-analysis"
                  name="analysis-type"
                  value="text"
                  checked={analysisType === "text"}
                  onChange={handleAnalysisTypeChange}
                />
                <label htmlFor="text-analysis">
                  Text Extraction & Tampering Detection
                </label>
              </div>
            </div>

            {/* Unified run button */}
            <button
              type="button"
              onClick={runUnifiedAnalysis}
              disabled={!selectedImage || isProcessing}
              className="primary-button accent full-width-button"
            >
              {isProcessing
                ? "Analyzing... Please Wait"
                : `Run Complete ${
                    analysisType === "image" ? "Image" : "Document"
                  } Analysis`}
            </button>
          </div>
        )}

        {/* Progress indicator */}
        {renderProgressIndicator()}

        {/* Status messages */}
        {processingStatus && (
          <div
            className={`status-message ${
              processingStatus.success ? "success" : "error"
            }`}
          >
            <p>{processingStatus.message}</p>
          </div>
        )}
      </div>

      {/* Unified results summary */}
      {renderUnifiedResults()}
    </div>
  );
};

export default UnifiedAnalysis;
