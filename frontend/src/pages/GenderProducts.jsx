import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Products from './Products';

const GenderProducts = () => {
  const { gender } = useParams(); // 'nam' or 'nu'  

  const genderValue = useMemo(() => {
    return gender === 'nam' ? 'Nam' : 'Nữ';
  }, [gender]);
  
  const presetFilters = useMemo(() => ({
    gender: genderValue
  }), [genderValue]);
  
  return <Products title={`Sản phẩm ${genderValue}`} presetFilters={presetFilters} />;
};

export default GenderProducts;