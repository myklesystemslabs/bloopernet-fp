import React, { useRef, useEffect } from 'react';
import p5 from 'p5';
import './AudioVisualizer.css';

const AudioVisualizer = ({ analyserNode, visualsEnabled }) => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);
  let previousX = -1;
  let previousY = -1;


  useEffect(() => {
    const sketch = (p) => {
      let buffer;
      //const SCROLL_SPEED = p.width / (10 * 60); // 1/10th of screen width per second

      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent(canvasRef.current);
        buffer = p.createGraphics(p.width, p.height);
        buffer.background(0, 0);
      };

      p.draw = () => {
        if (!visualsEnabled || !analyserNode) {
          p.clear();
          return;
        }

        // this is the number of samples we take per draw
        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteTimeDomainData(dataArray);

        // this is the number of pixels we shift per draw
        const SCROLL_SPEED = p.width / (5 * 60);

        // this is the ratio of sampes to pixels
        const SAMPLES_TO_PIXELS = SCROLL_SPEED / bufferLength;

        const colors = [
          p.color(75, 0, 130),   // Deep Purple
          p.color(138, 43, 226), // Blue Violet
          p.color(218, 112, 214),// Orchid
          p.color(255, 105, 180) // Hot Pink
        ];

        // Shift existing content to the left
        buffer.copy(buffer, SCROLL_SPEED, 0, p.width - SCROLL_SPEED, p.height, 0, 0, p.width - SCROLL_SPEED, p.height);
        // TODO: how to ignore alpha channel in this copy?

        // Clear the area where we're about to draw
        // buffer.fill(0,0); // problematic, because the buffer.copy command respects the alpha channel
        buffer.fill(0);

        buffer.noStroke();
        buffer.rect(p.width - SCROLL_SPEED, 0, SCROLL_SPEED, p.height);

        // Draw new data on the right edge
          buffer.stroke(colors[2]);
          for (let j = 0; j < SCROLL_SPEED; j++) {
            if (previousX === -1) {
              previousX = p.width - SCROLL_SPEED;
              previousY = p.height / 2;
            }
            const x = p.width - SCROLL_SPEED + j;
            const rawSample = dataArray[Math.floor(j / SAMPLES_TO_PIXELS) % bufferLength];
            const floatSample = (rawSample - 128) / 128;
            const screenSample = floatSample * p.height / 2;
            if (screenSample < 0) {
              console.log(screenSample);
            }
            const y = screenSample + (p.height / 2);
            if (y < 0) {
              console.log(y);
            }
            buffer.line(previousX, previousY, x, y);
            previousX = x;
            previousY = y;
          }

        // Display the buffer
        p.image(buffer, 0, 0);
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        let newBuffer = p.createGraphics(p.width, p.height);
        newBuffer.image(buffer, 0, 0, newBuffer.width, newBuffer.height);
        buffer = newBuffer;
      };
    };

    if (!p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch, canvasRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [analyserNode, visualsEnabled]);

  return <div ref={canvasRef} className="audio-visualizer" />;
};

export default AudioVisualizer;