"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { suggestDrawing } from "@/ai/flows/suggest-drawing";

const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.fillStyle = "#FFFFFF"; // Set background color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill with color
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
     if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.type === "touchstart") {
      const touch = (e as React.TouchEvent<HTMLCanvasElement>).touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left;
      y = (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top;
    }
    setLastPosition({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (e.type === "touchmove") {
      const touch = (e as React.TouchEvent<HTMLCanvasElement>).touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = (e as React.MouseEvent<HTMLCanvasElement>).clientX - rect.left;
      y = (e as React.MouseEvent<HTMLCanvasElement>).clientY - rect.top;
    }

    if (lastPosition) {
      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setLastPosition({ x, y });
  };

  const endDrawing = () => {
    setIsDrawing(false);
    setLastPosition(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF"; // Set background color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill with color
  };

  const generateSuggestions = async () => {
    setIsLoading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    // Convert canvas to a data URL
    const imageDataURL = canvas.toDataURL("image/png");
  
    // Create a temporary image element
    const img = new Image();
    img.src = imageDataURL;
  
    img.onload = async () => {
      // Create a new canvas to draw a smaller version of the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
  
      if (!tempCtx) {
        toast({
          title: "Error",
          description: "Could not create canvas context for generating prompt.",
        });
        setIsLoading(false);
        return;
      }
  
      // Set the dimensions for the smaller image
      const maxWidth = 100;
      const maxHeight = 100;
      let width = img.width;
      let height = img.height;
  
      // Scale down the image if it exceeds the maximum dimensions
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxHeight;
      }
  
      tempCanvas.width = width;
      tempCanvas.height = height;
  
      // Draw the image on the temporary canvas
      tempCtx.drawImage(img, 0, 0, width, height);
  
      // Extract the pixel data from the temporary canvas
      const pixels = tempCtx.getImageData(0, 0, width, height).data;
  
      // Convert pixel data to grayscale
      const grayValues = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        grayValues.push(gray);
      }
  
      // Determine brightness of the image based on average gray value
      let totalBrightness = 0;
      for (let i = 0; i < grayValues.length; i++) {
        totalBrightness += grayValues[i];
      }
      const avgBrightness = totalBrightness / grayValues.length;
      const isDarkImage = avgBrightness < 128;
  
      // Determine complexity by counting the number of distinct gray values
      const distinctGrayValues = new Set(grayValues);
      const isComplexImage = distinctGrayValues.size > 50;
  
      let sketchDescription = "a sketch";
      if (isDarkImage) {
        sketchDescription += " with dark tones";
      }
      if (isComplexImage) {
        sketchDescription += " with many details";
      }
  
      try {
        const aiSuggestions = await suggestDrawing({ sketchDescription });
        setSuggestions(aiSuggestions.map(s => s.suggestion));
        toast({
          title: "Suggestions generated",
          description: "AI has provided drawing suggestions.",
        });
      } catch (error) {
        console.error("Error generating suggestions:", error);
        toast({
          title: "Error",
          description: "Failed to generate AI drawing suggestions.",
        });
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-secondary">
        {/* Color Picker */}
        <div>
          <HexColorPicker color={strokeColor} onChange={setStrokeColor} />
        </div>

        {/* Stroke Width Adjustment */}
        <div className="flex items-center gap-2">
          <label htmlFor="strokeWidth" className="text-sm">
            Stroke Width:
          </label>
          <Slider
            id="strokeWidth"
            defaultValue={[strokeWidth]}
            max={20}
            min={1}
            step={1}
            onValueChange={(value) => setStrokeWidth(value[0])}
          />
          <span className="text-sm">{strokeWidth}</span>
        </div>

        {/* Clear Canvas Button */}
        <Button variant="outline" onClick={clearCanvas}>
          <Icons.trash className="w-4 h-4 mr-2" />
          Clear Canvas
        </Button>

        {/* Generate Suggestions Button */}
        <Button variant="outline" onClick={generateSuggestions} disabled={isLoading}>
          {isLoading ? (
            <>
              <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Icons.workflow className="w-4 h-4 mr-2" />
              Get Suggestions
            </>
          )}
        </Button>
      </div>

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight - 150} // Subtract toolbar height
        className="touch-none bg-white border-2 border-light-gray"
        style={{ touchAction: "none" }}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
        onMouseMove={draw}
        onTouchStart={startDrawing}
        onTouchEnd={endDrawing}
        onTouchMove={draw}
      ></canvas>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4">
          <h2 className="text-lg font-semibold">Suggestions:</h2>
          <ul className="list-disc pl-5">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;
