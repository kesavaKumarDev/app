import { useState, useEffect } from "react";
import "./TextAnalysis.css";

const TextAnalysis = ({
  selectedImage,
  previewUrl,
  triggerFileInput,
  handleFileChange,
  fileInputRef,
  showHistory,
  toggleHistory,
  deleteAllAnalyses,
  historyPanelRef,
  onReset, // Prop for resetting/updating parent state
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);
  const [savedTextAnalyses, setSavedTextAnalyses] = useState([]);
  const [currentTextAnalysisId, setCurrentTextAnalysisId] = useState(null);

  // Fetch saved text analyses on component mount
  useEffect(() => {
    fetchSavedTextAnalyses();
  }, []);

  // Add this useEffect inside the TextAnalysis component
  useEffect(() => {
    // When a new image is selected, reset analysis state
    if (selectedImage) {
      setExtractedText("");
      setParsedData(null);
      setAnalysisResults(null);
      setCurrentTextAnalysisId(null);
      setProcessingStatus(null);
    }
  }, [selectedImage]); // This will run whenever selectedImage changes

  // Debug data state changes
  useEffect(() => {
    console.log("Current parsedData:", parsedData);
  }, [parsedData]);

  useEffect(() => {
    console.log("Current analysisResults:", analysisResults);
  }, [analysisResults]);

  const fetchSavedTextAnalyses = async () => {
    try {
      console.log("Fetching saved text analyses...");
      const response = await fetch(
        "http://127.0.0.1:5000/api/get-text-analyses"
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched analyses:", data);

        if (data.success) {
          // Ensure data is properly parsed before storing in state
          const processedAnalyses = data.analyses.map((analysis) => {
            // Process parsedData if it's a string
            let parsedDataObj = analysis.parsedData;
            if (typeof analysis.parsedData === "string") {
              try {
                parsedDataObj = JSON.parse(analysis.parsedData);
              } catch (e) {
                console.error("Failed to parse parsedData:", e);
              }
            }

            // Process analysisResults if it's a string
            let analysisResultsObj = analysis.analysisResults;
            if (typeof analysis.analysisResults === "string") {
              try {
                analysisResultsObj = JSON.parse(analysis.analysisResults);
              } catch (e) {
                console.error("Failed to parse analysisResults:", e);
              }
            }

            return {
              ...analysis,
              parsedData: parsedDataObj,
              analysisResults: analysisResultsObj,
            };
          });

          setSavedTextAnalyses(processedAnalyses);
        } else {
          console.error(
            "Error in fetch response:",
            data.message || "Unknown error"
          );
        }
      } else {
        console.error("Failed to fetch analyses, status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching saved text analyses:", error);
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      setProcessingStatus({
        success: false,
        message: "Please select an image first",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Extract and Parse Text in one step
      setProcessingStep("extractParse");
      setProcessingStatus({
        success: true,
        message: "Extracting and parsing text...",
      });

      const formData = new FormData();
      formData.append("image", selectedImage);

      const extractParseResponse = await fetch(
        "http://127.0.0.1:5000/api/parse-receipt",
        { method: "POST", body: formData }
      );

      if (!extractParseResponse.ok) {
        throw new Error(
          `Text extraction and parsing failed: ${extractParseResponse.status}`
        );
      }

      const parseResult = await extractParseResponse.json();
      console.log("Parse result:", parseResult);

      // Store the extracted text and parsed data
      const parsedData = parseResult.data;
      const filename = parseResult.filename;
      const extractedText = JSON.stringify(parsedData, null, 2);

      setExtractedText(extractedText);
      setParsedData(parsedData);

      // Step 2: Analyze for tampering
      setProcessingStep("analyzing");
      setProcessingStatus({
        success: true,
        message: "Analyzing receipt for tampering...",
      });

      const requestData = {
        filename: `../uploads/${filename}`,
      };

      const tamperingResponse = await fetch(
        "http://127.0.0.1:5000/api/analyze-receipt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        }
      );

      if (!tamperingResponse.ok) {
        throw new Error(
          `Tampering analysis failed: ${tamperingResponse.status}`
        );
      }

      // Log the raw response text first
      const responseText = await tamperingResponse.text();
      console.log("Raw tampering response text:", responseText);

      // Then parse it
      const tamperingResult = JSON.parse(responseText);
      console.log("Parsed tampering result:", tamperingResult);
      console.log("Math verification data:", tamperingResult.math_verification);

      setAnalysisResults(tamperingResult);

      // const tamperingResponse = await fetch(
      //   "http://127.0.0.1:5000/api/analyze-receipt",
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(requestData),
      //   }
      // );

      // if (!tamperingResponse.ok) {
      //   throw new Error(
      //     `Tampering analysis failed: ${tamperingResponse.status}`
      //   );
      // }

      // const tamperingResult = await tamperingResponse.json();
      // console.log("Tampering result:", tamperingResult);
      // setAnalysisResults(tamperingResult);

      // Save the analysis to database
      await saveTextAnalysisToMongoDB(
        extractedText,
        parsedData,
        tamperingResult
      );

      setProcessingStatus({
        success: true,
        message: "Receipt analysis completed successfully!",
      });
    } catch (error) {
      console.error("Error during processing:", error);
      setProcessingStatus({
        success: false,
        message: `Processing failed during ${processingStep}: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  const saveTextAnalysisToMongoDB = async (text, parsed, results) => {
    try {
      console.log("Saving analysis to MongoDB...");

      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("extractedText", text);
      formData.append("parsedData", JSON.stringify(parsed || {}));
      formData.append("analysisResults", JSON.stringify(results || {}));
      formData.append("fileSize", selectedImage.size.toString());
      formData.append("fileName", selectedImage.name);

      const response = await fetch(
        "http://127.0.0.1:5000/api/save-text-analysis",
        { method: "POST", body: formData }
      );

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Save response:", result);

      if (result.success) {
        console.log("Text analysis saved successfully:", result.analysisId);
        await fetchSavedTextAnalyses();
      } else {
        console.error("Failed to save text analysis:", result.message);
      }
    } catch (error) {
      console.error("Error saving text analysis to MongoDB:", error);
      setProcessingStatus({
        success: false,
        message: `Failed to save analysis: ${error.message}`,
      });
    }
  };

  const loadTextAnalysis = async (analysis) => {
    try {
      setProcessingStatus({
        success: true,
        message: "Loading saved text analysis...",
      });

      setCurrentTextAnalysisId(analysis._id);
      console.log("Loading analysis:", analysis);

      // Load original image
      const originalImageResponse = await fetch(
        `http://127.0.0.1:5000/api/get-image/${analysis.originalImageId}`
      );

      if (!originalImageResponse.ok) {
        throw new Error("Failed to load original image");
      }

      const imageBlob = await originalImageResponse.blob();
      const imageUrl = URL.createObjectURL(imageBlob);

      // Process the data - ensure we're working with objects not strings
      let parsedDataObj = analysis.parsedData;
      let analysisResultsObj = analysis.analysisResults;

      console.log("Raw parsedData type:", typeof analysis.parsedData);
      console.log("Raw analysisResults type:", typeof analysis.analysisResults);

      // Handle if parsedData is stored as a string
      if (typeof analysis.parsedData === "string") {
        try {
          parsedDataObj = JSON.parse(analysis.parsedData);
          console.log("Parsed parsedData from string:", parsedDataObj);
        } catch (e) {
          console.error("Failed to parse parsedData string:", e);
        }
      }

      // Handle if analysisResults is stored as a string
      if (typeof analysis.analysisResults === "string") {
        try {
          analysisResultsObj = JSON.parse(analysis.analysisResults);
          console.log(
            "Parsed analysisResults from string:",
            analysisResultsObj
          );
        } catch (e) {
          console.error("Failed to parse analysisResults string:", e);
        }
      }

      // Create a new file from the blob to pass to the parent
      const imageFile = new File(
        [imageBlob],
        analysis.fileName || "loaded_image.jpg",
        { type: imageBlob.type }
      );

      // Call parent function to update the image display
      if (onReset && typeof onReset === "function") {
        onReset(imageFile, imageUrl);
      }

      // Set component state with the loaded data
      setExtractedText(analysis.extractedText || "");
      setParsedData(parsedDataObj);
      setAnalysisResults(analysisResultsObj);

      setProcessingStatus({
        success: true,
        message: "Receipt analysis loaded successfully!",
      });
    } catch (error) {
      console.error("Error loading text analysis:", error);
      setProcessingStatus({
        success: false,
        message: `Failed to load text analysis: ${error.message}`,
      });
    }
  };

  const deleteTextAnalysis = async (analysisId, event) => {
    event.stopPropagation();

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/delete-text-analysis/${analysisId}`,
        { method: "DELETE" }
      );

      const result = await response.json();
      if (result.success) {
        // Remove from local state
        setSavedTextAnalyses(
          savedTextAnalyses.filter((a) => a._id !== analysisId)
        );

        // Check if the deleted analysis is currently being viewed
        if (currentTextAnalysisId === analysisId) {
          // Reset text analysis state
          setExtractedText("");
          setParsedData(null);
          setAnalysisResults(null);
          setCurrentTextAnalysisId(null);
          // Reset parent state
          if (onReset && typeof onReset === "function") {
            onReset();
          }
        }
      } else {
        console.error("Failed to delete text analysis:", result.message);
      }
    } catch (error) {
      console.error("Error deleting text analysis:", error);
    }
  };

  const deleteAllTextAnalyses = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/delete-all-text-analyses",
        { method: "DELETE" }
      );

      const result = await response.json();
      if (result.success) {
        setSavedTextAnalyses([]);
        setExtractedText("");
        setParsedData(null);
        setAnalysisResults(null);
        setCurrentTextAnalysisId(null);
        // Reset parent state
        if (onReset && typeof onReset === "function") {
          onReset();
        }
      } else {
        console.error("Failed to delete all text analyses:", result.message);
      }
    } catch (error) {
      console.error("Error deleting all text analyses:", error);
    }
  };

  const handleReset = () => {
    // Clear component state
    setExtractedText("");
    setParsedData(null);
    setAnalysisResults(null);
    setCurrentTextAnalysisId(null);
    setProcessingStatus(null);

    // Reset parent state
    if (onReset && typeof onReset === "function") {
      onReset();
    }
  };

  const renderParsedData = () => {
    if (!parsedData) {
      console.log("No parsed data to render");
      return null;
    }

    console.log("Rendering parsed data:", parsedData);

    // Check if we have the expected data structure
    const shopName = parsedData["Company/Shop/Restaurant Name"];
    const address = parsedData["Address"];
    const purchaseDate = parsedData["Date of Purchase"];
    const paymentMethod = parsedData["Payment Method"];
    const lineItems = Array.isArray(parsedData["Line Items"])
      ? parsedData["Line Items"]
      : [];
    const subtotal = parsedData["Subtotal"];
    const tax = parsedData["Tax Amount"];
    const total = parsedData["Total Amount"];

    return (
      <div className="parsed-data-container">
        <h4>Receipt Information</h4>
        <div className="receipt-header">
          {shopName && (
            <div className="receipt-merchant">
              <strong>{shopName}</strong>
            </div>
          )}
          {address && <div className="receipt-address">{address}</div>}
          {purchaseDate && (
            <div className="receipt-date">Date: {purchaseDate}</div>
          )}
          {paymentMethod && (
            <div className="receipt-payment">Payment: {paymentMethod}</div>
          )}
        </div>

        {lineItems && lineItems.length > 0 && (
          <div className="line-items-container">
            <h5>Items Purchased</h5>
            <table className="line-items-table">
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.Quantity}</td>
                    <td>{item.Description}</td>
                    <td>
                      $
                      {typeof item.UnitPrice === "number"
                        ? item.UnitPrice.toFixed(2)
                        : item.UnitPrice}
                    </td>
                    <td>
                      $
                      {typeof item.Total === "number"
                        ? item.Total.toFixed(2)
                        : item.Total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="receipt-summary">
          {subtotal !== undefined && (
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>
                ${typeof subtotal === "number" ? subtotal.toFixed(2) : subtotal}
              </span>
            </div>
          )}
          {tax !== undefined && (
            <div className="summary-row">
              <span>Tax:</span>
              <span>${typeof tax === "number" ? tax.toFixed(2) : tax}</span>
            </div>
          )}
          {total !== undefined && (
            <div className="summary-row total-row">
              <span>Total:</span>
              <span>
                ${typeof total === "number" ? total.toFixed(2) : total}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTamperingResults = () => {
    if (!analysisResults) {
      console.log("No analysis results to render");
      return null;
    }

    console.log("Rendering tampering results:", analysisResults);

    // Safely access properties
    const isMathCorrect = analysisResults.is_math_correct;
    const mathVerification = analysisResults.math_verification || {};
    const illegalItems = Array.isArray(analysisResults.illegal_items_found)
      ? analysisResults.illegal_items_found
      : [];
    const inconsistencies = Array.isArray(analysisResults.inconsistencies)
      ? analysisResults.inconsistencies
      : [];

    return (
      <div className="tampering-results">
        <h3>Receipt Verification Results</h3>

        <div className="verification-section">
          <h4>Math Verification</h4>
          <div className="verification-item">
            <span className="verification-label">Calculations:</span>
            <span
              className={`verification-status ${
                isMathCorrect ? "verified" : "suspicious"
              }`}
            >
              {isMathCorrect ? "Correct" : "Discrepancy Found"}
            </span>
          </div>

          {console.log(mathVerification.reported_subtotal)}

          {mathVerification && (
            <div className="math-details">
              <div className="math-row">
                <span>Reported Subtotal:</span>
                <span>
                  $
                  {typeof mathVerification.reported_subtotal === "number"
                    ? mathVerification.reported_subtotal.toFixed(2)
                    : mathVerification.reported_subtotal || "0.00"}
                </span>
              </div>
              <div className="math-row">
                <span>Calculated Subtotal:</span>
                <span>
                  $
                  {typeof mathVerification.calculated_subtotal === "number"
                    ? mathVerification.calculated_subtotal.toFixed(2)
                    : mathVerification.calculated_subtotal || "0.00"}
                </span>
              </div>
              <div className="math-row">
                <span>Reported Total:</span>
                <span>
                  $
                  {typeof mathVerification.reported_total === "number"
                    ? mathVerification.reported_total.toFixed(2)
                    : mathVerification.reported_total || "0.00"}
                </span>
              </div>
              <div className="math-row">
                <span>Calculated Total:</span>
                <span>
                  $
                  {typeof mathVerification.calculated_total === "number"
                    ? mathVerification.calculated_total.toFixed(2)
                    : mathVerification.calculated_total || "0.00"}
                </span>
              </div>
            </div>
          )}
        </div>

        {illegalItems.length > 0 && (
          <div className="verification-section">
            <h4>Prohibited Items</h4>
            <ul className="items-list">
              {illegalItems.map((item, idx) => (
                <li key={idx} className="illegal-item">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {inconsistencies.length > 0 && (
          <div className="verification-section">
            <h4>Detected Inconsistencies</h4>
            <ul className="inconsistencies-list">
              {inconsistencies.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="verification-summary">
          <div className="summary-icon">
            {isMathCorrect && illegalItems.length === 0 ? "✅" : "⚠️"}
          </div>
          <div className="summary-text">
            {isMathCorrect && illegalItems.length === 0
              ? "Receipt appears valid"
              : "Receipt has potential issues"}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressIndicator = () => {
    if (!isProcessing) return null;

    const steps = [
      { id: "extractParse", label: "Extract & Parse" },
      { id: "analyzing", label: "Analyzing" },
    ];

    // Find current step index
    const currentStepIndex = steps.findIndex(
      (step) => step.id === processingStep
    );

    return (
      <div className="progress-indicator">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step 
              ${processingStep === step.id ? "active" : ""} 
              ${index < currentStepIndex ? "completed" : ""}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Helper function to safely get merchant name from analysis
  const getMerchantName = (analysis) => {
    // Try to get merchant name from parsed data
    if (analysis.parsedData) {
      // If parsedData is already an object
      if (
        typeof analysis.parsedData === "object" &&
        analysis.parsedData !== null
      ) {
        if (analysis.parsedData["Company/Shop/Restaurant Name"]) {
          return analysis.parsedData["Company/Shop/Restaurant Name"];
        }
      }
      // If parsedData is a string that needs parsing
      else if (typeof analysis.parsedData === "string") {
        try {
          const parsed = JSON.parse(analysis.parsedData);
          if (parsed["Company/Shop/Restaurant Name"]) {
            return parsed["Company/Shop/Restaurant Name"];
          }
        } catch (e) {
          console.error("Error parsing string data:", e);
        }
      }
    }

    // Fallback to filename or default
    return analysis.fileName || "Unnamed Receipt";
  };

  // Helper function to safely get total amount from analysis
  const getTotalAmount = (analysis) => {
    // Try to get total from parsed data
    if (analysis.parsedData) {
      // If parsedData is already an object
      if (
        typeof analysis.parsedData === "object" &&
        analysis.parsedData !== null
      ) {
        if (analysis.parsedData["Total Amount"] !== undefined) {
          const total = analysis.parsedData["Total Amount"];
          return `$${typeof total === "number" ? total.toFixed(2) : total}`;
        }
      }
      // If parsedData is a string that needs parsing
      else if (typeof analysis.parsedData === "string") {
        try {
          const parsed = JSON.parse(analysis.parsedData);
          if (parsed["Total Amount"] !== undefined) {
            const total = parsed["Total Amount"];
            return `$${typeof total === "number" ? total.toFixed(2) : total}`;
          }
        } catch (e) {
          console.error("Error parsing string data:", e);
        }
      }
    }

    // Default label
    return "Receipt Analysis";
  };

  return (
    <div className="text-analysis-component">
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
            <img src={previewUrl} alt="Selected" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <i className="upload-icon">📁</i>
              <p>Click to upload a receipt image for analysis</p>
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
              onClick={handleReset}
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
              if (
                window.confirm(
                  "Are you sure you want to delete all receipt analysis history? This cannot be undone."
                )
              ) {
                deleteAllTextAnalyses();
              }
            }}
          >
            <i className="trash-icon">🗑️</i> Delete History
          </button>
        </div>
      </div>

      <div className="text-extraction-controls">
        <button
          type="button"
          onClick={processImage}
          disabled={!selectedImage || isProcessing}
          className="extraction-button primary-button"
        >
          {isProcessing ? "Processing..." : "Analyze Receipt"}
        </button>
      </div>

      {/* Progress indicator */}
      {renderProgressIndicator()}

      {/* Status messages */}
      {processingStatus && (
        <div
          className={`status-message ${
            processingStatus.success ? "success" : "error"
          }`}
        >
          {processingStatus.message}
        </div>
      )}

      {/* Display receipt information if available */}
      {renderParsedData()}

      {/* Display receipt verification results if available */}
      {renderTamperingResults()}

      {/* History Panel */}
      {showHistory && (
        <div className="history-panel" ref={historyPanelRef}>
          <h3>Receipt Analysis History</h3>
          {savedTextAnalyses.length === 0 ? (
            <p>No saved receipt analyses found.</p>
          ) : (
            <ul className="history-list">
              {savedTextAnalyses.map((analysis) => (
                <li
                  key={analysis._id}
                  className="history-item"
                  onClick={() => loadTextAnalysis(analysis)}
                >
                  <div className="history-item-details">
                    <span className="history-item-name">
                      {getMerchantName(analysis)}
                    </span>
                    <span className="history-item-type">
                      {getTotalAmount(analysis)}
                    </span>
                    <span className="history-item-date">
                      {formatDate(analysis.createdAt)}
                    </span>
                  </div>
                  <button
                    className="delete-history-btn"
                    onClick={(e) => deleteTextAnalysis(analysis._id, e)}
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
  );
};

export default TextAnalysis;
