import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export default function ObstacleDetector({ onObstacleDetected }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Load the model
  useEffect(() => {
    cocoSsd.load().then(loadedModel => {
      setModel(loadedModel);
      console.log("COCO-SSD Model Loaded");
    });
  }, []);

  // Detection loop
  useEffect(() => {
    let animationFrameId;
    
    const runDetection = async () => {
      if (isActive && model) {
        await detectFrame();
        animationFrameId = requestAnimationFrame(runDetection);
      }
    };

    if (isActive && model) {
      runDetection();
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, model]);

  const detectFrame = async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Set video width and height
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      
      // Make predictions
      const predictions = await model.detect(video);
      
      // Look for obstacles
      const obstacleClasses = ['person', 'car', 'bicycle', 'chair', 'bench'];
      
      let detectedObstacle = null;
      for (let pred of predictions) {
        if (obstacleClasses.includes(pred.class) && pred.score > 0.6) {
          detectedObstacle = pred.class;
          break;
        }
      }
      
      if (detectedObstacle) {
        onObstacleDetected(`Warning: ${detectedObstacle} detected in path!`);
      }
      
      // Draw bounding boxes on canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        
        predictions.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          
          if (obstacleClasses.includes(prediction.class) && prediction.score > 0.6) {
            ctx.strokeStyle = '#EF4444'; // Red for obstacles
          } else {
            ctx.strokeStyle = '#10B981'; // Green for safe objects
          }
          
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);
          
          ctx.fillStyle = ctx.strokeStyle;
          ctx.font = '16px Arial';
          ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, x, y > 20 ? y - 5 : 20);
        });
      }
    }
  };

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>AI Camera Scanner</h3>
        <button 
          className={`btn-primary ${isActive ? 'btn-accent' : ''}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          onClick={() => setIsActive(!isActive)}
          disabled={!model}
        >
          {isActive ? 'Stop Scanner' : (model ? 'Start Scanner' : 'Loading AI...')}
        </button>
      </div>

      {isActive && (
        <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', backgroundColor: '#000' }}>
          <Webcam
            ref={webcamRef}
            muted={true} 
            style={{
              width: "100%",
              display: "block"
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 8
            }}
          />
        </div>
      )}
    </div>
  );
}
