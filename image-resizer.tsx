import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';

const ImageResizer = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [resizedImages, setResizedImages] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [originalType, setOriginalType] = useState(null);

  const resizeSizes = [64, 32, 16];

  const loadSVG = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svg = new Blob([e.target.result], {type: 'image/svg+xml'});
        resolve(URL.createObjectURL(svg));
      };
      reader.readAsText(file);
    });
  };

  const resizeImage = async (file, targetSize) => {
    return new Promise(async (resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate aspect ratio preserving dimensions
        let width = targetSize;
        let height = targetSize;
        const aspectRatio = img.width / img.height;
        
        if (aspectRatio > 1) {
          // Wider than tall
          width = targetSize;
          height = Math.round(targetSize / aspectRatio);
        } else {
          // Taller than wide
          height = targetSize;
          width = Math.round(targetSize * aspectRatio);
        }

        // Create temporary canvas for initial resize
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(img, 0, 0, width, height);

        // Create final canvas with padding
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize;
        const finalCtx = finalCanvas.getContext('2d');

        // Center the image in the final canvas
        const x = Math.floor((targetSize - width) / 2);
        const y = Math.floor((targetSize - height) / 2);

        // Make background transparent
        finalCtx.clearRect(0, 0, targetSize, targetSize);

        // Draw the resized image
        finalCtx.drawImage(tempCanvas, x, y);

        // Detect and remove white background
        const imageData = finalCtx.getImageData(0, 0, targetSize, targetSize);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Check if pixel is white or very close to white
          if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) {
            data[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }
        finalCtx.putImageData(imageData, 0, 0);
        
        finalCanvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/png');
      };

      // Handle SVG differently
      if (file.type === 'image/svg+xml') {
        const svgUrl = await loadSVG(file);
        img.src = svgUrl;
      } else {
        img.src = URL.createObjectURL(file);
      }
    });
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || (!file.type.startsWith('image/png') && file.type !== 'image/svg+xml')) {
      alert('PNGまたはSVGファイルをドロップしてください。');
      return;
    }

    setOriginalType(file.type);
    
    if (file.type === 'image/svg+xml') {
      const svgUrl = await loadSVG(file);
      setOriginalImage(svgUrl);
    } else {
      setOriginalImage(URL.createObjectURL(file));
    }

    const newResizedImages = {};
    for (const size of resizeSizes) {
      newResizedImages[size] = await resizeImage(file, size);
    }
    setResizedImages(newResizedImages);
  }, []);

  const handleDownload = (url, size) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `resized_${size}x${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const dragEvents = {
    onDragOver: (e) => {
      e.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      setIsDragging(false);
    },
    onDrop: handleDrop
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${!originalImage ? 'hover:border-blue-500 hover:bg-blue-50' : ''}`}
        {...(!originalImage ? dragEvents : {})}
      >
        {!originalImage ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="text-gray-500">PNGまたはSVGファイルをドラッグ&ドロップしてください</p>
          </div>
        ) : (
          <div className="relative max-w-full max-h-64 mx-auto">
            <img
              src={originalImage}
              alt="Original"
              className="max-h-64 mx-auto"
              style={{
                backgroundImage: originalType === 'image/svg+xml' ? 'none' : 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'
              }}
            />
          </div>
        )}
      </div>

      {originalImage && (
        <div className="grid grid-cols-3 gap-4">
          {resizeSizes.map(size => (
            <div key={size} className="flex flex-col items-center gap-2 p-4 border rounded">
              <div 
                className="bg-gray-100"
                style={{
                  width: size,
                  height: size,
                  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={resizedImages[size]}
                  alt={`${size}x${size}`}
                  style={{
                    maxWidth: size,
                    maxHeight: size,
                    imageRendering: size < 32 ? 'pixelated' : 'auto'
                  }}
                />
              </div>
              <p className="text-sm text-gray-600">{size}x{size}</p>
              <button
                onClick={() => handleDownload(resizedImages[size], size)}
                className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                ダウンロード
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageResizer;