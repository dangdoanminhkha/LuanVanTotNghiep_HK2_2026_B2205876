import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Products from './Products';

const CategoryProducts = () => {
  const { categorySlug } = useParams(); // e.g. 'sandalnam', 'caogotnu'

  const { genderValue, categoryValue, title } = useMemo(() => {
    // Map category slugs to filter values
    const categoryMap = {
      // Nam categories
      'sandalnam': { gender: 'Nam', category: 'sandal-nam', title: 'Sandal Nam' },
      'hunternam': { gender: 'Nam', category: 'hunter-nam', title: 'Hunter Nam' },
      'thethaonam': { gender: 'Nam', category: 'thethao-nam', title: 'Thể Thao Nam' },
      
      // Nữ categories  
      'sandalnu': { gender: 'Nữ', category: 'sandal-nu', title: 'Sandal Nữ' },
      'caogotnu': { gender: 'Nữ', category: 'cao-got-nu', title: 'Cao Gót Nữ' },
      'bupbenu': { gender: 'Nữ', category: 'bup-be-nu', title: 'Búp Bê Nữ' },
    };
    
    const mapping = categoryMap[categorySlug] || { 
      gender: '', 
      category: categorySlug, 
      title: categorySlug 
    };
    
    return {
      genderValue: mapping.gender,
      categoryValue: mapping.category,
      title: mapping.title
    };
  }, [categorySlug]);
  
  const presetFilters = useMemo(() => {
    const filters = {};
    if (genderValue) filters.gender = genderValue;
    if (categoryValue) filters.category = categoryValue;
    return filters;
  }, [genderValue, categoryValue]);
  
  return <Products title={title} presetFilters={presetFilters} />;
};

export default CategoryProducts;