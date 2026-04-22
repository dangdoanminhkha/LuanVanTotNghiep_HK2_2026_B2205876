import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const zaloPhone = import.meta.env.VITE_ZALO_PHONE;

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(offset > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Zalo Contact Button */}
      <a
        href={`https://zalo.me/${zaloPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-200"
        aria-label="Contact via Zalo"
        title="Liên hệ qua Zalo"
      >
        <SiZalo size={24} />
      </a>

      {/* Scroll to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
        aria-label="Scroll to top"
        title="Về đầu trang"
      >
        <FaArrowUp size={18} />
      </button>
    </>
  );
};

export default ScrollToTopButton;
