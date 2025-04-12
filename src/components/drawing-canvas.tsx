"use client";

import { useState, useRef, useEffect } from "react";
import { GithubPicker } from "react-color";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Circle } from "lucide-react";

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
	const { toast } = useToast();
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	// Define stroke sizes
	const strokeSizes = [
		{ size: 2, icon: <Circle size={10} />, label: "Small" },
		{ size: 5, icon: <Circle size={16} />, label: "Medium" },
		{ size: 10, icon: <Circle size={20} />, label: "Large" },
	];

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

		ctx.strokeStyle = isEraser ? "#FFFFFF" : strokeColor;
		ctx.lineWidth = isEraser ? strokeWidth * 4 : strokeWidth;

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
							title={label}
						>
							{icon}
						</Button>
					))}
				</div>

				{/* Clear Canvas Button */}
				<Button variant="outline" onClick={clearCanvas}>
					<Icons.trash className="w-4 h-4 mr-2" />
					Clear Canvas
				</Button>

				{/* Pen Toggle */}
				<Button
					variant={isEraser ? "outline" : "default"}
					onClick={() => setIsEraser(false)}
				>
					<Icons.pen className="w-4 h-4" />
				</Button>
				{/* Eraser Toggle */}
				<Button
					variant={isEraser ? "default" : "outline"}
					onClick={() => setIsEraser(!isEraser)}
				>
					<Icons.eraser className="w-4 h-4" />
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
