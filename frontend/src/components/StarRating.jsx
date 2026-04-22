import { useState } from 'react';

const StarRating = ({ 
  value = 0, 
  onChange = null, 
  readonly = false, 
  size = 'text-xl',
  showLabel = false,
  label = ''
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  
  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Rất tệ',
      2: 'Tệ', 
      3: 'Bình thường',
      4: 'Tốt',
      5: 'Rất tốt'
    };
    return texts[rating] || '';
  };

  const displayValue = hoverValue || value;

  // Hàm xác định loại sao: full, half, empty
  const getStarType = (star) => {
    if (star <= Math.floor(displayValue)) return 'full';
    if (star === Math.ceil(displayValue) && displayValue % 1 >= 0.5) return 'half';
    return 'empty';
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && <span className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">{label}:</span>}
      
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const starType = getStarType(star);
          
          return (
            <button
              key={star}
              type="button"
              className={`${size} ${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors duration-150 ${!readonly ? 'hover:text-yellow-300' : ''}`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              style={{
                position: 'relative',
                display: 'inline-block'
              }}
            >
              {/* Sao rỗng (nền) */}
              <span className="text-gray-300">★</span>
              
              {/* Sao đầy hoặc nửa sao (overlay) */}
              {starType !== 'empty' && (
                <span 
                  className="text-yellow-400 absolute top-0 left-0"
                  style={{
                    overflow: 'hidden',
                    width: starType === 'half' ? '50%' : '100%'
                  }}
                >
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!readonly && hoverValue > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {getRatingText(hoverValue)}
        </span>
      )}

      {readonly && value > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          ({value}/5)
        </span>
      )}
    </div>
  );
};

export default StarRating;