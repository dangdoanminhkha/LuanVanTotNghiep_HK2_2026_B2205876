"""
Image Search Evaluation using CLIP Model
========================================
Evaluate CLIP-based image search on Shoes dataset.

Flow:
1. Scan tất cả ảnh trong ml/Shoes/[ShoeType]/[Brand]/[image.jpg]
2. Tạo dictionary: {filename: "ShoeType_Brand"}
3. Cache embeddings CLIP cho tất cả ảnh
4. Leave-one-out evaluation:
   - Lặp từng ảnh làm Query Image
   - Tìm top 10 ảnh tương tự (trong toàn bộ Gallery trừ query image)
   - Check: Nếu top 10 có chứa ảnh cùng "ShoeType_Brand" → Hit (cộng 1 điểm)
   - Chú ý: Phải khớp ở cả ShoeType và Brand (multi-level path)
5. Tính chỉ số:
   - Hit Rate = số hit / tổng query
   - Precision@10 = số hit / 10
   - Recall@10 (gần đúng)

Usage:
  python evaluate_image_search.py [--topk K] [--max_samples N] [--skip_cache]

Dependencies:
  open_clip, torch, PIL, numpy, pandas
"""

import os
import sys
import json
import pickle
import random
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict
import numpy as np
from PIL import Image
import torch
import open_clip

# Import ImageSearcher từ image_search.py
sys.path.insert(0, str(Path(__file__).parent))
from image_search import ImageSearcher


class EvaluationImageSearcher(ImageSearcher):
    """ImageSearcher subclass cho evaluation - lưu embeddings riêng tránh ảnh hưởng hệ thống chính."""
    
    # Override cache paths để lưu vào thư mục evaluation
    CACHE_DIR = Path(__file__).parent / "models" / "evaluation" / "eval_image_features.pkl"
    DESCRIPTION_CACHE_DIR = Path(__file__).parent / "models" / "evaluation" / "eval_description_features.pkl"
    METADATA_CACHE_DIR = Path(__file__).parent / "models" / "evaluation" / "eval_image_metadata.pkl"


class ShoeImageEvaluator:
    """Evaluate CLIP-based image search on shoes dataset."""
    
    def __init__(self, shoes_dir: str = "Shoes"):
        """
        Initialize evaluator.
        
        Args:
            shoes_dir: Path to Shoes directory (relative to ml folder)
        """
        self.shoes_dir = Path(__file__).parent / shoes_dir
        self.gallery_paths: List[str] = []  # List of absolute paths
        self.path_to_label: Dict[str, str] = {}  # {filename: "ShoeType_Brand"}
        self.filename_to_path: Dict[str, str] = {}  # {filename: absolute_path}
        self.label_to_filenames: Dict[str, List[str]] = defaultdict(list)
        self.image_searcher = None
        
    def scan_gallery(self, min_images_required: int = 10) -> int:
        """
        Scan ml/Shoes/ folder recursively to build gallery.
        Lọc bỏ các nhãn (label) có số lượng ảnh < min_images_required.
        """
        print("[*] Scanning gallery folder...")
        if not self.shoes_dir.exists():
            print(f"[ERROR] Shoes directory not found: {self.shoes_dir}")
            return 0
        
        # 1. Đọc lướt để gom nhóm
        temp_label_to_paths = defaultdict(list)
        for shoe_type_dir in self.shoes_dir.iterdir():
            if not shoe_type_dir.is_dir(): continue
            shoe_type = shoe_type_dir.name
            
            for brand_dir in shoe_type_dir.iterdir():
                if not brand_dir.is_dir(): continue
                brand = brand_dir.name
                label = f"{shoe_type}_{brand}"
                
                for image_file in brand_dir.iterdir():
                    if image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                        temp_label_to_paths[label].append(str(image_file))
        
        # 2. Lọc tinh hoa: Chỉ lấy các thư mục đủ số lượng để test Top-K
        count = 0
        for label, paths in temp_label_to_paths.items():
            if len(paths) >= min_images_required:
                for absolute_path in paths:
                    filename = Path(absolute_path).name
                    self.gallery_paths.append(absolute_path)
                    self.path_to_label[absolute_path] = label
                    self.filename_to_path[filename] = absolute_path
                    self.label_to_filenames[label].append(filename)
                    count += 1
            else:
                # Bỏ qua các thư mục quá ít ảnh
                continue
                
        print(f"✓ Found {count} valid images across {len(self.label_to_filenames)} brands (min >= {min_images_required} images)")
        return count
    
    def initialize_searcher(self, skip_cache: bool = False):
        """
        Initialize ImageSearcher and cache all embeddings.
        
        Args:
            skip_cache: If True, ignore cached embeddings and re-extract
        """
        print("\n[*] Initializing CLIP model (using evaluation cache)...")
        self.image_searcher = EvaluationImageSearcher()
        
        if skip_cache:
            # Clear cache
            self.image_searcher.embeddings_cache.clear()
            self.image_searcher.metadata_cache.clear()
        
        # Prepare product list for caching
        products = []
        for idx, image_path in enumerate(self.gallery_paths):
            filename = Path(image_path).name
            product = {
                "id": f"img_{idx}",  # Unique ID
                "product_id": idx,  # Needed for grouping
                "image": image_path,
                "variant_id": 0,
                "image_index": 0,
            }
            products.append(product)
        
        print(f"[*] Caching embeddings for {len(products)} images...")
        self.image_searcher.cache_product_embeddings(products)
    
    def get_label_from_path(self, image_path: str) -> str:
        """Get label (ShoeType_Brand) from image path."""
        return self.path_to_label.get(image_path, "Unknown")
    
    def evaluate_leave_one_out(self, top_k: int = 10, max_samples: int = None) -> Dict:
        """
        Leave-one-out evaluation:
        - For each image as query:
          1. Search top_k images (excluding the query image)
          2. Check if any top_k images share same label (ShoeType_Brand)
          3. If match → Hit = 1, else → Hit = 0
        
        Args:
            top_k: Number of top results to check
            max_samples: Max number of queries to evaluate (None = all)
        
        Returns:
            Dictionary with evaluation metrics
        """
        if not self.image_searcher or not self.gallery_paths:
            print("[ERROR] Searcher not initialized or no gallery!")
            return {}
        
        print(f"\n[*] Running leave-one-out evaluation (top_k={top_k})...")
        
        # Prepare evaluation set
        eval_paths = self.gallery_paths
        if max_samples:
            eval_paths = random.sample(self.gallery_paths, min(max_samples, len(self.gallery_paths)))
        
        total_queries = 0
        hits_count = 0
        precision_sum = 0.0
        mrr_sum = 0.0
        ap_sum = 0.0
        results_per_label = defaultdict(lambda: {"hits": 0, "total": 0})
        detailed_results = []
        
        for idx, query_path in enumerate(eval_paths, 1):
            if idx % 50 == 0 or idx == 1:
                print(f"  Progress: {idx}/{len(eval_paths)}", end='\r')
            
            query_label = self.get_label_from_path(query_path)
            query_filename = Path(query_path).name
            
            # Search top_k results
            # Note: ImageSearcher.search() takes image_path and returns list of (product_id, similarity)
            # But we need to map back to filenames
            try:
                search_results = self.image_searcher.search(query_path, threshold=0.0, top_n=top_k + 1)
            except Exception as e:
                print(f"\n[WARN] Search failed for {query_filename}: {e}")
                continue
            
            # Get filenames and labels of search results
            result_filenames = []
            result_labels = []
            
            for product_id, similarity in search_results:
                if product_id >= len(self.gallery_paths):
                    continue
                result_path = self.gallery_paths[product_id]
                # Skip query image itself
                # LOO yêu cầu retrieval "ảnh khác cùng class", không tính chính nó.
                if result_path == query_path:
                    continue
                
                result_filenames.append(Path(result_path).name)
                result_labels.append(self.get_label_from_path(result_path))
                if len(result_filenames) >= top_k:
                    break
            
            # --- TÍNH TOÁN METRICS CHO TỪNG TRUY VẤN ---
            correct_images_in_top_k = 0
            query_ap = 0.0
            first_hit_pos = 0
            
            for pos, label in enumerate(result_labels, 1):
                if label == query_label:
                    correct_images_in_top_k += 1
                    query_ap += correct_images_in_top_k / pos
                    if first_hit_pos == 0:
                        first_hit_pos = pos
            
            # --- CỘNG DỒN VÀO TỔNG ---
            total_queries += 1
            results_per_label[query_label]["total"] += 1
            
            if correct_images_in_top_k > 0:
                hits_count += 1
                results_per_label[query_label]["hits"] += 1
                mrr_sum += 1.0 / first_hit_pos
                
            precision_sum += correct_images_in_top_k / top_k
            # Bản chất đây là AP@K gần đúng cho bài toán chỉ có 1 lớp đúng theo label.
            ap_sum += query_ap / top_k
            
            detailed_results.append({
                "query_filename": query_filename,
                "is_hit": correct_images_in_top_k > 0
            })
        
        print(f"  Progress: {total_queries}/{len(eval_paths)} hoàn tất!      ")
        
        # --- TÍNH TRUNG BÌNH TOÀN HỆ THỐNG ---
        hit_rate = hits_count / total_queries if total_queries > 0 else 0.0
        precision_at_k = precision_sum / total_queries if total_queries > 0 else 0.0
        mrr = mrr_sum / total_queries if total_queries > 0 else 0.0
        map_score = ap_sum / total_queries if total_queries > 0 else 0.0
        
        print("\n" + "="*60)
        print(f"IMAGE SEARCH EVALUATION (Leave-One-Out, samples={total_queries})")
        print("="*60)
        print(f"Total Queries: {total_queries}")
        print(f"Hit Rate@{top_k}:    {hit_rate:.4f}")
        print(f"Precision@{top_k}:   {precision_at_k:.4f}")
        print(f"MRR@{top_k}:         {mrr:.4f}")
        print(f"mAP@{top_k}:         {map_score:.4f}")
        print("="*60 + "\n")
        
        return {
            "total_queries": total_queries,
            "total_hits": hits_count,
            "hit_rate": hit_rate,
            "precision_at_k": precision_at_k,
            "mrr": mrr,
            "map": map_score,
            "top_k": top_k,
            "results_per_label": dict(results_per_label),
        }
           
    
    def evaluate_random_samples(self, num_samples: int = 10, top_k: int = 10) -> Dict:
        """
        Random sampling evaluation với công thức Toán học chuẩn xác cho Precision, MRR và mAP.
        """
        print(f"\n[*] Running random sample evaluation (samples={num_samples}, top_k={top_k})...")
        
        if not self.gallery_paths:
            print("[ERROR] No gallery!")
            return {}
        
        # Randomly select query images
        query_paths = random.sample(self.gallery_paths, min(num_samples, len(self.gallery_paths)))
        
        total_queries = 0
        hits_count = 0        # Số lượt truy vấn có ít nhất 1 kết quả đúng
        precision_sum = 0.0   # Tổng Precision
        mrr_sum = 0.0         # Tổng MRR
        ap_sum = 0.0          # Tổng Average Precision (mAP)
        
        results_per_label = defaultdict(lambda: {"hits": 0, "total": 0})
        detailed_results = []
        
        for idx, query_path in enumerate(query_paths, 1):
            print(f"  Sample {idx}/{len(query_paths)}", end='\r')
            
            query_label = self.get_label_from_path(query_path)
            query_filename = Path(query_path).name
            
            # Search top_k results
            try:
                search_results = self.image_searcher.search(query_path, threshold=0.0, top_n=top_k + 1)
            except Exception as e:
                print(f"\n[WARN] Search failed for {query_filename}: {e}")
                continue
            
            result_filenames = []
            result_labels = []
            
            for product_id, similarity in search_results:
                if product_id >= len(self.gallery_paths): continue
                result_path = self.gallery_paths[product_id]
                # Bỏ qua chính ảnh đang truy vấn
                if result_path == query_path: continue
                
                result_filenames.append(Path(result_path).name)
                result_labels.append(self.get_label_from_path(result_path))
                if len(result_filenames) >= top_k: break
            
            # --- TÍNH TOÁN METRICS CHO TỪNG TRUY VẤN ---
            correct_images_in_top_k = 0
            query_ap = 0.0
            first_hit_pos = 0
            
            for pos, label in enumerate(result_labels, 1):
                if label == query_label:
                    correct_images_in_top_k += 1
                    query_ap += correct_images_in_top_k / pos  # Tính điểm AP
                    if first_hit_pos == 0:
                        first_hit_pos = pos                    # Đánh dấu vị trí cho MRR
            
            # --- CỘNG DỒN VÀO TỔNG ---
            total_queries += 1
            results_per_label[query_label]["total"] += 1
            
            if correct_images_in_top_k > 0:
                hits_count += 1
                results_per_label[query_label]["hits"] += 1
                mrr_sum += 1.0 / first_hit_pos
                
            precision_sum += correct_images_in_top_k / top_k
            ap_sum += query_ap / top_k 
            
            detailed_results.append({
                "query_filename": query_filename,
                "is_hit": correct_images_in_top_k > 0
            })
            
        print(f"  Sample {total_queries}/{total_queries} hoàn tất!      ")
        
        # --- TÍNH TRUNG BÌNH TOÀN HỆ THỐNG ---
        hit_rate = hits_count / total_queries if total_queries > 0 else 0.0
        precision_at_k = precision_sum / total_queries if total_queries > 0 else 0.0
        mrr = mrr_sum / total_queries if total_queries > 0 else 0.0
        map_score = ap_sum / total_queries if total_queries > 0 else 0.0
        
        print("\n" + "="*60)
        print(f"IMAGE SEARCH EVALUATION (Filtered <11 items, samples={total_queries})")
        print("="*60)
        print(f"Total Queries: {total_queries}")
        print(f"Hit Rate@{top_k}:    {hit_rate:.4f} (Tỷ lệ tìm trúng ít nhất 1 ảnh)")
        print(f"Precision@{top_k}:   {precision_at_k:.4f} (Tỷ lệ ảnh đúng trong {top_k} kết quả)")
        print(f"MRR@{top_k}:         {mrr:.4f} (Vị trí đúng đầu tiên)")
        print(f"mAP@{top_k}:         {map_score:.4f} (Chất lượng xếp hạng tổng thể)")
        print("="*60 + "\n")
        
        return {
            "total_queries": total_queries,
            "total_hits": hits_count,
            "hit_rate": hit_rate,
            "precision_at_k": precision_at_k,
            "mrr": mrr,
            "map": map_score,
            "top_k": top_k,
            "num_samples": num_samples,
            "results_per_label": dict(results_per_label)
        }
    
    def save_report(self, eval_result: Dict, output_path: str = "models/evaluation/image_search_evaluation.json"):
        """Save evaluation results to JSON."""
        if not eval_result:
            print("[ERROR] Cannot save empty evaluation result")
            return
            
        output_file = Path(__file__).parent / output_path
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert defaultdicts to regular dicts for JSON serialization
        report = {
            "eval_type": "leave_one_out" if eval_result.get("total_queries", 0) == len(self.gallery_paths) else "random_sample",
            "total_gallery_size": len(self.gallery_paths),
            "total_queries": eval_result.get("total_queries", 0),
            "total_hits": eval_result.get("total_hits", 0),
            "hit_rate": eval_result.get("hit_rate", 0.0),
            "precision_at_k": eval_result.get("precision_at_k", 0.0),
            "mrr": eval_result.get("mrr", 0.0),
            "map": eval_result.get("map", 0.0),
            "top_k": eval_result.get("top_k", 10),
            "results_per_label": eval_result.get("results_per_label", {}),
        }
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Report saved to {output_file}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate CLIP-based image search")
    parser.add_argument("--topk", type=int, default=10, help="Top-k results to check (default: 10)")
    parser.add_argument("--max_samples", type=int, default=None, help="Max samples for evaluation (None = all)")
    parser.add_argument("--skip_cache", action="store_true", help="Skip cached embeddings and re-extract")
    parser.add_argument("--random_samples", type=int, default=None, help="Use random sampling instead of leave-one-out (specify number of samples)")
    args = parser.parse_args()
    
    # Run evaluation
    evaluator = ShoeImageEvaluator()
    
    # Step 1: Scan gallery
    count = evaluator.scan_gallery()
    if count == 0:
        print("[ERROR] No images found!")
        return
    
    # Step 2: Initialize CLIP searcher
    evaluator.initialize_searcher(skip_cache=args.skip_cache)
    
    # Step 3: Run evaluation
    if args.random_samples:
        result = evaluator.evaluate_random_samples(num_samples=args.random_samples, top_k=args.topk)
    else:
        result = evaluator.evaluate_leave_one_out(top_k=args.topk, max_samples=args.max_samples)
    
    # Step 4: Save report
    if result:
        evaluator.save_report(result)
    else:
        print("[ERROR] Evaluation returned empty result")


if __name__ == "__main__":
    main()
