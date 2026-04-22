import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Products from './Products';

const BestsellingProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Set sort to 'bestselling' when component mounts
    if (searchParams.get('sort') !== 'bestselling') {
      setSearchParams({ ...Object.fromEntries(searchParams), sort: 'bestselling' });
    }
  }, [searchParams, setSearchParams]);

  return <Products title="Sản phẩm bán chạy" />;
};

export default BestsellingProducts;