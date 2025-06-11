import React from 'react';

interface MediaCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const MediaCard: React.FC<MediaCardProps> = ({
  imageUrl,
  title,
  subtitle,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg p-4 cursor-pointer flex flex-col gap-4 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Play ${title}`}
    >
      <div className="aspect-square w-full rounded-md overflow-hidden bg-neutral-700">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${title} cover`}
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col items-start">
        <p className="text-white font-semibold truncate w-full text-sm md:text-base">{title}</p>
        {subtitle && (
          <p className="text-neutral-400 text-xs md:text-sm truncate w-full">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default MediaCard;
