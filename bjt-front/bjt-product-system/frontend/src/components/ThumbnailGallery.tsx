import React, { useState } from 'react';
import { Modal } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

/** 缩略图/主图加载失败时占位，避免留白盒 */
const IMAGE_FALLBACK_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="#f3f4f6"/><path d="M40 40L88 88M40 88L88 40" stroke="#9ca3af" stroke-width="2"/></svg>'
  );

interface ThumbnailGalleryProps {
  images: string[];
  altText?: string;
  className?: string;
  /** main-with-thumbnails: thumbs below; thumbnails-left: Figma style vertical thumbs on the left */
  layout?: 'grid' | 'main-with-thumbnails' | 'thumbnails-left';
}

const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({
  images,
  altText = 'Product Image',
  className = '',
  layout = 'main-with-thumbnails'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const validImages = images.filter((img) => img && img.trim() !== '');
  /** 先去重保留最多 4 条不同 URL（其它布局用） */
  const uniqueUrls = [...new Set(validImages.map((s) => s.trim()))].filter(Boolean);
  /**
   * Figma Frame 205：左侧固定最多 3 枚缩略 + 右侧 1 枚主图 = 共 4 个槽位。
   * 接口里多条字段常指向同一 URL，Set 去重后只剩 1 张会导致左侧整列消失。
   * thumbnails-left 下在仅有 1～3 条不同素材时，按序循环填满 4 槽，保证结构与稿一致（重复 URL 仍合法）。
   */
  let displayImages =
    layout === 'thumbnails-left' && uniqueUrls.length > 0 && uniqueUrls.length < 4
      ? (() => {
          const out = [...uniqueUrls];
          let i = 0;
          while (out.length < 4) {
            out.push(uniqueUrls[i % uniqueUrls.length]);
            i += 1;
          }
          return out.slice(0, 4);
        })()
      : uniqueUrls.slice(0, 4);

  if (displayImages.length === 0) {
    return null;
  }

  const THUMB_ROW_MAX = 4;

  /** thumbnails-left：最多 3 张缩略图 = 除当前主图外的图（4 张素材时即「3 小 + 1 大」） */
  const leftColumnThumbSlots = (() => {
    if (layout !== 'thumbnails-left' || displayImages.length <= 1) return [];
    return displayImages
      .map((img, i) => ({ img, i }))
      .filter(({ i }) => i !== currentImageIndex)
      .sort((a, b) => a.i - b.i)
      .slice(0, 3);
  })();

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

  const mainBlock = (
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
            if (target.src !== IMAGE_FALLBACK_SRC) {
              target.src = IMAGE_FALLBACK_SRC;
            }
          }}
        />
        <div className="main-image-overlay">
          <div className="enlarge-hint">点击放大</div>
        </div>
      </div>
    </div>
  );

  const thumbsRow = (direction: 'row' | 'column') => (
    <div className={direction === 'row' ? 'thumbnails-row' : 'thumbnails-column'}>
      {displayImages.slice(0, THUMB_ROW_MAX).map((image, index) => (
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
              if (target.src !== IMAGE_FALLBACK_SRC) {
                target.src = IMAGE_FALLBACK_SRC;
              }
            }}
          />
          {index === currentImageIndex && direction === 'row' && (
            <div className="active-indicator"></div>
          )}
          {index === currentImageIndex && direction === 'column' && (
            <div className="active-indicator active-indicator--left-col"></div>
          )}
        </div>
      ))}
    </div>
  );

  if (layout === 'thumbnails-left') {
    return (
      <>
        <div
          className={`thumbnail-gallery-left ${className} ${
            leftColumnThumbSlots.length === 0 ? 'thumbnail-gallery-left--main-only' : ''
          }`.trim()}
        >
          {leftColumnThumbSlots.length > 0 && (
            <div className="thumbnails-column">
              {leftColumnThumbSlots.map(({ img, i }) => (
                <div
                  key={i}
                  className="thumbnail-small"
                  onClick={() => setCurrentImageIndex(i)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${altText} ${i + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentImageIndex(i);
                    }
                  }}
                >
                  <img
                    src={img}
                    alt={`${altText} ${i + 1}`}
                    className="thumbnail-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== IMAGE_FALLBACK_SRC) {
                        target.src = IMAGE_FALLBACK_SRC;
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {mainBlock}
        </div>
        {/* Image Modal — same as main-with-thumbnails */}
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
                  type="button"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
                  onClick={goToPrevious}
                >
                  <LeftOutlined className="text-xl" />
                </button>
                <button
                  type="button"
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

  if (layout === 'main-with-thumbnails') {
    return (
      <>
        <div className={`thumbnail-gallery-main ${className}`}>
          {mainBlock}
          {thumbsRow('row')}
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
          {validImages.slice(0, THUMB_ROW_MAX).map((image, index) => (
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