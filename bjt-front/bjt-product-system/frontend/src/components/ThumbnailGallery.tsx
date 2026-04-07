import React, { useState } from 'react';
import { Modal } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface ThumbnailGalleryProps {
  images: string[];
  altText?: string;
  className?: string;
  layout?: 'grid' | 'main-with-thumbnails';
}

const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({
  images,
  altText = 'Product Image',
  className = '',
  layout = 'main-with-thumbnails'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Filter out empty or invalid image URLs
  const validImages = images.filter(img => img && img.trim() !== '');

  if (validImages.length === 0) {
    return null;
  }

  // Ensure we have at least 3 images by repeating the first image if necessary
  const displayImages = [...validImages];
  while (displayImages.length < 3 && validImages.length > 0) {
    displayImages.push(validImages[0]);
  }

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  };

  if (layout === 'main-with-thumbnails') {
    return (
      <>
        {/* Main Image with Thumbnails Layout */}
        <div className={`thumbnail-gallery-main ${className}`}>
          {/* Large Main Image */}
          <div className="main-image-container">
            <div
              className="main-image-wrapper"
              onClick={() => openModal(currentImageIndex)}
            >
              <img
                src={displayImages[currentImageIndex]}
                alt={`${altText} - Main View`}
                className="main-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Click to enlarge overlay */}
              <div className="main-image-overlay">
                <div className="enlarge-hint">点击放大</div>
              </div>
            </div>
          </div>

          {/* Small Thumbnails */}
          <div className="thumbnails-row">
            {displayImages.slice(0, 3).map((image, index) => (
              <div
                key={index}
                className={`thumbnail-small ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                role="button"
                tabIndex={0}
                aria-label={`${altText} ${index + 1}`}
                aria-pressed={index === currentImageIndex}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }
                }}
              >
                <img
                  src={image}
                  alt={`${altText} ${index + 1}`}
                  className="thumbnail-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {/* Active indicator */}
                {index === currentImageIndex && (
                  <div className="active-indicator"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Image Modal */}
        <Modal
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          width="90vw"
          style={{ maxWidth: '1200px' }}
          centered
          destroyOnClose
          className="image-modal"
          closeIcon={<span className="text-white text-xl">×</span>}
          maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onKeyDown={handleKeyDown}
          keyboard
        >
          <div className="relative">
            {/* Navigation buttons */}
            {displayImages.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                  onClick={goToPrevious}
                >
                  <LeftOutlined className="text-xl" />
                </button>
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                  onClick={goToNext}
                >
                  <RightOutlined className="text-xl" />
                </button>
              </>
            )}

            {/* Main image */}
            <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
              <img
                src={displayImages[currentImageIndex]}
                alt={`${altText} ${currentImageIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
                style={{ maxHeight: '80vh' }}
              />
            </div>

            {/* Image counter */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {displayImages.length}
              </div>
            )}

            {/* Thumbnail navigation */}
            {displayImages.length > 1 && (
              <div className="flex justify-center mt-4 gap-2 max-w-full overflow-x-auto pb-2">
                {displayImages.map((image, index) => (
                  <div
                    key={index}
                    className={`
                      w-16 h-16 cursor-pointer rounded border-2 transition-all duration-200 flex-shrink-0
                      ${index === currentImageIndex 
                        ? 'border-blue-500 shadow-lg' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </>
    );
  }

  // Original grid layout (fallback)
  return (
    <>
      {/* Original Thumbnail Grid */}
      <div className={`thumbnail-gallery ${className}`}>
        <div className="flex flex-wrap gap-2">
          {validImages.slice(0, 3).map((image, index) => (
            <div
              key={index}
              className="w-20 h-20 cursor-pointer relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 bg-gray-50 p-1 shadow-sm hover:shadow-md group"
              onClick={() => openModal(index)}
            >
              <img
                src={image}
                alt={`${altText} ${index + 1}`}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 px-2 py-1 rounded">
                  点击放大
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal (same as above) */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        width="90vw"
        style={{ maxWidth: '1200px' }}
        centered
        destroyOnClose
        className="image-modal"
        closeIcon={<span className="text-white text-xl">×</span>}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onKeyDown={handleKeyDown}
        keyboard
      >
        <div className="relative">
          {displayImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                onClick={goToPrevious}
              >
                <LeftOutlined className="text-xl" />
              </button>
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                onClick={goToNext}
              >
                <RightOutlined className="text-xl" />
              </button>
            </>
          )}

          <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
            <img
              src={displayImages[currentImageIndex]}
              alt={`${altText} ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
              style={{ maxHeight: '80vh' }}
            />
          </div>

          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ThumbnailGallery; 