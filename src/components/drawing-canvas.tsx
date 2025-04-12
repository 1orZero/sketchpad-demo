"use client";

import { useState, useRef, useEffect } from "react";
import { GithubPicker } from "react-color";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

export const DrawingCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [strokeColor, setStrokeColor] = useState("#000000");
	const [strokeWidth, setStrokeWidth] = useState(5);
	const [lastPosition, setLastPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const { toast } = useToast();
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const updateDimensions = () => {
			setDimensions({
				width: window.innerWidth,
				height: window.innerHeight - 150,
			});
		};

		// Initial dimensions
		updateDimensions();

		// Update dimensions on resize
		window.addEventListener("resize", updateDimensions);
		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

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

	return (
		<div className="flex flex-col h-screen">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-secondary">
				{/* Color Picker */}
				<div>
					<GithubPicker
						triangle="hide"
						color={strokeColor}
						onChange={(color: { hex: string }) =>
							setStrokeColor(color.hex)
						}
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
			</div>

			{/* Drawing Canvas */}
			<canvas
				ref={canvasRef}
				width={dimensions.width}
				height={dimensions.height}
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
		</div>
	);
};
