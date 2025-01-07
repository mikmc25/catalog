import React, { useEffect, useState, useCallback } from 'react';

const RatedPoster = ({ posterUrl, rating, title, contentId, onError }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleError = useCallback((error) => {
    setError(error.message);
    setIsLoading(false);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  useEffect(() => {
    let isMounted = true;

    const loadPoster = async () => {
      if (!posterUrl || !contentId) {
        handleError(new Error('Missing required props'));
        return;
      }

      try {
        // First try to get cached version
        const cacheResponse = await fetch(`/rated-poster/${contentId}`);
        
        if (cacheResponse.ok) {
          if (isMounted) {
            setImageUrl(`/rated-poster/${contentId}`);
            setIsLoading(false);
          }
          return;
        }

        // If no cache exists, request a new cached version
        const createResponse = await fetch('/cache-rated-poster', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            posterUrl,
            rating,
            contentId
          })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create rated poster');
        }

        const { path } = await createResponse.json();

        if (isMounted) {
          setImageUrl(path);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          handleError(err);
          // Fallback to original poster
          setImageUrl(posterUrl);
        }
      }
    };

    loadPoster();

    return () => {
      isMounted = false;
    };
  }, [posterUrl, rating, contentId, handleError]);

  if (error) {
    return (
      <div className="relative w-full h-full">
        <img 
          src={posterUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        {rating && (
          <div className="absolute top-0 right-0 m-2 bg-black/50 text-white px-2 py-1 rounded-md font-bold">
            {parseFloat(rating).toFixed(1)}
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={title} 
      className="w-full h-full object-cover"
      onError={() => {
        handleError(new Error('Failed to load image'));
      }}
    />
  );
};

export default RatedPoster;