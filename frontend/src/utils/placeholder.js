// Reusable inline SVG fallback to avoid external placeholder host
export const FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <rect width='100%' height='100%' fill='%23f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text>
  </svg>
`)}`;

export default FALLBACK_SVG;
