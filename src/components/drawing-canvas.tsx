"use client";

import { useState, useRef, useEffect } from "react";
import { GithubPicker } from "react-color";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Circle, Download } from "lucide-react";

export const DrawingCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [isEraser, setIsEraser] = useState(false);
	const [strokeWidth, setStrokeWidth] = useState(5);
	const [lastPosition, setLastPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [cursorPosition, setCursorPosition] = useState<{
		x: number;
		y: number;
	}>({ x: 0, y: 0 });
	const [showCursor, setShowCursor] = useState(false);
	const { toast } = useToast();
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	// Add cursor style based on tool
	const cursorStyle: React.CSSProperties = isEraser
		? {
				cursor: "none",
				position: "relative" as const,
		  }
		: {};

	// Add custom cursor element
	const CustomCursor = () => {
		if (!isEraser || !showCursor) return null;

		return (
			<div
				style={{
					position: "fixed",
					pointerEvents: "none",
					width: strokeWidth * 8,
					height: strokeWidth * 8,
					border: "2px solid #999",
					borderRadius: "50%",
					backgroundColor: "rgba(255, 255, 255, 0.3)",
					transform: "translate(-50%, -50%)",
					zIndex: 1000,
					left: cursorPosition.x,
					top: cursorPosition.y,
				}}
			/>
		);
	};

	// Define stroke sizes
	const strokeSizes = [
		{ size: 2, icon: <Circle size={10} />, label: "Small" },
		{ size: 5, icon: <Circle size={16} />, label: "Medium" },
		{ size: 10, icon: <Circle size={20} />, label: "Large" },
	];

	useEffect(() => {
		const updateDimensions = () => {
			if (canvasRef.current) {
				setDimensions({
					width: canvasRef.current.clientWidth,
					height: canvasRef.current.clientHeight,
				});
			}
		};

		updateDimensions();
	}, [canvasRef.current]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.lineCap = "round";
		ctx.fillStyle = "#FFFFFF"; // Set background color
		ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill with color
	}, []);

	const startDrawing = (
		e:
			| React.MouseEvent<HTMLCanvasElement>
			| React.TouchEvent<HTMLCanvasElement>
	) => {
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

	const draw = (
		e:
			| React.MouseEvent<HTMLCanvasElement>
			| React.TouchEvent<HTMLCanvasElement>
	) => {
		if (!isDrawing) return;

		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

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

		if (isEraser) {
			// For eraser, fill a circle at the current position
			ctx.fillStyle = "#FFFFFF";
			ctx.beginPath();
			ctx.arc(x, y, strokeWidth * 4, 0, Math.PI * 4);
			ctx.fill();
		} else {
			// For pen, draw a line as before
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = strokeWidth;
			if (lastPosition) {
				ctx.beginPath();
				ctx.moveTo(lastPosition.x, lastPosition.y);
				ctx.lineTo(x, y);
				ctx.stroke();
			}
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

	const exportCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Create a temporary canvas to ensure white background
		const tempCanvas = document.createElement("canvas");
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		const tempCtx = tempCanvas.getContext("2d");
		if (!tempCtx) return;

		// Fill with white background
		tempCtx.fillStyle = "#FFFFFF";
		tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

		// Draw the original canvas content
		tempCtx.drawImage(canvas, 0, 0);

		// Create a temporary link element
		const link = document.createElement("a");
		link.download = "drawing.png";
		link.href = tempCanvas.toDataURL("image/png");
		link.click();
	};

	return (
		<div className="flex flex-col h-[100dvh]">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-secondary">
				{/* Color Picker */}
				<div>
					<GithubPicker
						triangle="hide"
						color={strokeColor}
						onChange={(color: { hex: string }) => {
							setStrokeColor(color.hex);
							setIsEraser(false);
							setShowCursor(false);
						}}
						width="212px"
						colors={[
							"#000000",
							"#B80000",
							"#DB3E00",
							"#FCCB00",
							"#008B02",
							"#1273DE",
							"#004DCF",
							"#5300EB",
						]}
					/>
				</div>

				{/* Stroke Width Buttons */}
				<div className="flex items-center gap-2">
					{strokeSizes.map(({ size, icon, label }) => (
						<Button
							key={size}
							variant={
								strokeWidth === size ? "default" : "outline"
							}
							size="icon"
							className={`[&_svg]:size-[${size}]`}
							onClick={() => setStrokeWidth(size)}
							onTouchEnd={(e) => {
								e.preventDefault();
								setStrokeWidth(size);
							}}
							title={label}
						>
							{icon}
						</Button>
					))}
				</div>

				{/* Pen Toggle */}
				<Button
					variant={isEraser ? "outline" : "default"}
					onClick={() => {
						setIsEraser(false);
						setShowCursor(false);
					}}
					onTouchEnd={(e) => {
						e.preventDefault();
						setIsEraser(false);
						setShowCursor(false);
					}}
				>
					<Icons.pen className="w-4 h-4" />
				</Button>
				{/* Eraser Toggle */}
				<Button
					variant={isEraser ? "default" : "outline"}
					onClick={() => {
						setIsEraser(true);
						setShowCursor(false);
					}}
					onTouchEnd={(e) => {
						e.preventDefault();
						setIsEraser(true);
						setShowCursor(false);
					}}
				>
					<Icons.eraser className="w-4 h-4" />
				</Button>

				{/* Clear Canvas Button */}
				<Button variant="outline" onClick={clearCanvas}>
					<Icons.trash className="w-4 h-4 mr-2" />
					Clear Canvas
				</Button>

				{/* Export Button */}
				<Button variant="outline" onClick={exportCanvas}>
					<Download className="w-4 h-4 mr-2" />
					Export
				</Button>
			</div>

			{/* Drawing Canvas */}
			<div className="relative flex-1">
				<CustomCursor />
				<canvas
					ref={canvasRef}
					height={dimensions.height}
					width={dimensions.width}
					className="w-full h-full touch-none bg-white border-2 border-light-gray"
					style={{
						touchAction: "none",
						...cursorStyle,
					}}
					onMouseEnter={() => setShowCursor(true)}
					onMouseLeave={() => setShowCursor(false)}
					onMouseDown={startDrawing}
					onMouseUp={endDrawing}
					onMouseOut={endDrawing}
					onMouseMove={(e) => {
						draw(e);
						// Update custom cursor position
						if (isEraser) {
							setCursorPosition({ x: e.clientX, y: e.clientY });
						}
					}}
					onTouchStart={(e) => {
						startDrawing(e);
						if (isEraser) {
							const touch = e.touches[0];
							setCursorPosition({
								x: touch.clientX,
								y: touch.clientY,
							});
							setShowCursor(true);
						}
					}}
					onTouchEnd={(e) => {
						endDrawing();
						setShowCursor(false);
					}}
					onTouchMove={(e) => {
						draw(e);
						if (isEraser) {
							const touch = e.touches[0];
							setCursorPosition({
								x: touch.clientX,
								y: touch.clientY,
							});
						}
					}}
				></canvas>
			</div>
		</div>
	);
};
