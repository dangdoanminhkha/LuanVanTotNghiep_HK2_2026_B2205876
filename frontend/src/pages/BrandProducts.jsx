import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Products from './Products';

const BrandProducts = () => {
  const { brand } = useParams(); // e.g. 'biti-s' or 'nike'

  const brandValue = useMemo(() => {
    const brandMap = {
      'biti-s': 'Biti\'s',
      'nike': 'Nike',
      'adidas': 'Adidas',
      'puma': 'Puma',
      'converse': 'Converse',
      'vans': 'Vans'
    };
    
    return brandMap[brand] || brand;
  }, [brand]);
  
  const presetFilters = useMemo(() => ({
    brand: brandValue
  }), [brandValue]);
  
  return <Products title={`Sản phẩm ${brandValue}`} presetFilters={presetFilters} />;
};

export default BrandProducts;