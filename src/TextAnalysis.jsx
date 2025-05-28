import { useState } from "react";
import "./TextAnalysis.css";

const TextAnalysis = ({ selectedImage, previewUrl }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [processingStep, setProcessingStep] = useState(null);

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
      setExtractedText(result.text);
      setParsedData(result.parsedData);

      // Step 2: Analyze for tampering
      setProcessingStep("analyzing");
      setProcessingStatus({
        success: true,
        message: "Analyzing text for tampering...",
      });

      const requestData = {
        parsedData: result.parsedData,
        originalText: result.text,
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
      setAnalysisResults(tamperingResult);

      // All done!
      setProcessingStatus({
        success: true,
        message: "Analysis completed successfully!",
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

  const renderParsedData = () => {
    if (!parsedData) return null;

    return (
      <div className="parsed-data-container">
        <h4>Parsed Key-Value Pairs:</h4>
        <div className="key-value-grid">
          {Object.entries(parsedData).map(([key, value], index) => (
            <div key={index} className="key-value-pair">
              <div className="key-container">{key}:</div>
              <div className="value-container">{value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTamperingResults = () => {
    if (!analysisResults) return null;

    return (
      <div className="tampering-results">
        <h3>Text Tampering Analysis Results</h3>
        <div className="result-item">
          <strong>Text manipulation detected:</strong>{" "}
          {analysisResults.isManipulated ? "Yes" : "No"}
        </div>

        {analysisResults.manipulationProbability && (
          <div className="result-item">
            <strong>Manipulation probability:</strong>{" "}
            {(analysisResults.manipulationProbability * 100).toFixed(2)}%
          </div>
        )}

        {analysisResults.manipulationType && (
          <div className="result-item">
            <strong>Detected manipulation type:</strong>{" "}
            {analysisResults.manipulationType}
          </div>
        )}

        {analysisResults.suspiciousFields &&
          analysisResults.suspiciousFields.length > 0 && (
            <div className="result-item">
              <strong>Suspicious fields:</strong>
              <ul className="suspicious-fields-list">
                {analysisResults.suspiciousFields.map((field, index) => (
                  <li key={index}>
                    <span className="field-name">{field.name}</span>:
                    <span className="field-reason">{field.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {analysisResults.inconsistencies &&
          analysisResults.inconsistencies.length > 0 && (
            <div className="result-item">
              <strong>Detected inconsistencies:</strong>
              <ul>
                {analysisResults.inconsistencies.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
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
            className={`progress-step ${
              processingStep === step.id ? "active" : ""
            } 
                      ${index < currentStepIndex ? "completed" : ""}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="text-analysis-component">
      <div className="image-preview-section">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            className="text-analysis-preview"
          />
        )}
      </div>

      <div className="text-extraction-controls">
        <button
          type="button"
          onClick={processImage}
          disabled={!selectedImage || isProcessing}
          className="extraction-button primary-button"
        >
          {isProcessing ? "Processing..." : "Analyze Document"}
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

      {/* Display the extracted text if available */}
      {extractedText && (
        <div className="extracted-text-container">
          <h4>Extracted Text:</h4>
          <div className="extracted-text">{extractedText}</div>
        </div>
      )}

      {/* Display parsed data if available */}
      {renderParsedData()}

      {/* Display tampering results if available */}
      {renderTamperingResults()}
    </div>
  );
};

export default TextAnalysis;
