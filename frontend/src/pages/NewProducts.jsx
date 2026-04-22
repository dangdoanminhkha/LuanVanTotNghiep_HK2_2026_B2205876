import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Products from './Products';

const NewProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Set sort to 'newest' when component mounts
    if (searchParams.get('sort') !== 'newest') {
      setSearchParams({ ...Object.fromEntries(searchParams), sort: 'newest' });
    }
  }, [searchParams, setSearchParams]);

  return <Products title="Sản phẩm mới" />;
};

export default NewProducts;