import { calcTvCanvasSize } from '../tv-utils.js';

export const shapeDrawerSketch = function (p) {
    let points = [];
    let canvasSize;
    const UI_PADDING_TOP_BOTTOM = 20;
    const UI_PADDING_LEFT_RIGHT = 80;
    const BUTTON_SIZE = 28;
    const BUTTON_SPACING = 6;

    p.setup = function () {
        canvasSize = calcTvCanvasSize();
        p.createCanvas(canvasSize.width, canvasSize.height);
    };

    p.draw = function () {
        p.background(40);

        // Draw center crosshairs so you know where (0,0) is
        p.stroke(100);
        p.strokeWeight(1);
        p.line(p.width / 2, 0, p.width / 2, p.height);
        p.line(0, p.height / 2, p.width, p.height / 2);

        // Shift origin to the center of the canvas
        p.translate(p.width / 2, p.height / 2);

        // Draw the shape as you click
        if (points.length > 0) {
            p.stroke(0, 255, 150); // Neon green lines
            p.strokeWeight(2);
            p.fill(255, 255, 255, 50); // Translucent white fill

            p.beginShape();
            for (let pt of points) {
                p.vertex(pt.x, pt.y);

                // Draw a small dot at each vertex
                p.push();
                p.fill(255);
                p.noStroke();
                p.circle(pt.x, pt.y, 6);
                p.pop();
            }
            p.endShape();

            // Draw line preview to the next point
            if (points.length > 0) {
                const lastPoint = points[points.length - 1];
                p.stroke(255, 0, 0); // Red line preview
                p.strokeWeight(1);
                p.line(lastPoint.x, lastPoint.y, p.mouseX - canvasSize.width / 2, p.mouseY - canvasSize.height / 2);
            }
        }

        // Draw subtle UI buttons in top-left corner
        p.resetMatrix();
        drawSubtleUIButtons();
    };

    function drawSubtleUIButtons() {
        const startX = UI_PADDING_LEFT_RIGHT;
        const startY = UI_PADDING_TOP_BOTTOM;

        // Copy button (C)
        drawSubtleButton(startX, startY, "CP", 0, 150, 100);

        // Reset button (R)
        drawSubtleButton(startX + BUTTON_SIZE + BUTTON_SPACING, startY, "RS", 150, 50, 0);
    }

    function drawSubtleButton(x, y, label, r, g, b) {
        // Dark semi-transparent background
        p.fill(30, 30, 30, 200);
        p.stroke(r, g, b);
        p.strokeWeight(1);
        p.rect(x, y, BUTTON_SIZE, BUTTON_SIZE, 3);

        // Label text
        p.fill(r, g, b, 180);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(label, x + BUTTON_SIZE / 2, y + BUTTON_SIZE / 2);
    }

    p.mousePressed = function () {
        const copyButtonX = UI_PADDING_LEFT_RIGHT;
        const copyButtonY = UI_PADDING_TOP_BOTTOM;
        const resetButtonX = copyButtonX + BUTTON_SIZE + BUTTON_SPACING;
        const resetButtonY = UI_PADDING_TOP_BOTTOM;

        // Check if clicking on Copy button
        if (p.mouseX >= copyButtonX && p.mouseX <= copyButtonX + BUTTON_SIZE &&
            p.mouseY >= copyButtonY && p.mouseY <= copyButtonY + BUTTON_SIZE) {
            generateCode();
            return false;
        }

        // Check if clicking on Reset button
        if (p.mouseX >= resetButtonX && p.mouseX <= resetButtonX + BUTTON_SIZE &&
            p.mouseY >= resetButtonY && p.mouseY <= resetButtonY + BUTTON_SIZE) {
            points = [];
            return false;
        }

        // Check if clicking on the drawing area
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            // Convert screen coordinates to center-relative (0,0) coordinates
            const centerX = p.width / 2;
            const centerY = p.height / 2;
            points.push({
                x: Math.round(p.mouseX - centerX),
                y: Math.round(p.mouseY - centerY)
            });
            return false;
        }
    };

    p.keyPressed = function () {
        if (p.key === 'C' || p.key === 'c') {
            generateCode();
            return false;
        } else if (p.key === 'R' || p.key === 'r') {
            points = [];
            return false;
        }
    };

    function generateCode() {
        if (points.length === 0) return;

        let code = "p.beginShape();\n";
        for (let pt of points) {
            code += `p.vertex(${pt.x}, ${pt.y});\n`;
        }
        code += "p.endShape(p.CLOSE);";

        console.log(code);
        navigator.clipboard.writeText(code)
            .then(() => alert("Code copied to clipboard!"))
            .catch(err => alert("Clipboard copy failed. Check the browser console!"));
    }
};
