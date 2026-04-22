import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Products from './Products';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const BrandCollection = () => {
  const { brandSlug } = useParams();
  const [brandName, setBrandName] = useState('');

  // Fetch brand name from API based on slug
  useEffect(() => {
    if (brandSlug) {
      axios.get(`${API_URL}/brands`)
        .then(res => {
          const brands = res.data || [];
          const foundBrand = brands.find(b => b.slug === brandSlug);
          if (foundBrand) {
            setBrandName(foundBrand.name);
          } else {
            // Fallback: capitalize the slug
            setBrandName(brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          }
        })
        .catch(err => {
          console.error('Error fetching brand:', err);
          setBrandName(brandSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
        });
    }
  }, [brandSlug]);

  const presetFilters = useMemo(() => {
    return brandName ? { brand: brandName } : {};
  }, [brandName]);

  return (
    <Products 
      title={`Sản phẩm ${brandName}`} 
      presetFilters={presetFilters} 
    />
  );
};

export default BrandCollection;
