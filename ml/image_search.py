"""
Image-based Product Search using CLIP Model
===========================================
Cắm vào file ảnh sản phẩm, trả về sản phẩm giống nhất dựa trên hình ảnh.

Tối ưu hoá:
  1. Load CLIP model một lần (cache global)
  2. Extract features từ product images khi train
  3. Tính similarity cosine khi search
  4. Threshold 50% để tránh false positives

Usage:
  searcher = ImageSearcher()
  product_id, similarity = searcher.search(uploaded_image_path, threshold=0.5)
"""

import os
import pickle
import io
from pathlib import Path

import numpy as np
from PIL import Image

try:
    import open_clip
    import torch
    HAS_CLIP = True
except ImportError:
    HAS_CLIP = False
    print("[WARN] CLIP libraries chưa cài. Hãy chạy: pip install -r requirements.txt")


class ImageSearcher:
    """CLIP-based image search cho sản phẩm."""

    MODEL_NAME = "ViT-B-32"
    PRETRAINED = "openai"
    CACHE_DIR = Path(__file__).parent / "models" / "image_features.pkl"
    DESCRIPTION_CACHE_DIR = Path(__file__).parent / "models" / "description_features.pkl"
    METADATA_CACHE_DIR = Path(__file__).parent / "models" / "image_metadata.pkl"

    def __init__(self):
        """Khởi tạo CLIP model và load cached embeddings nếu có."""
        if not HAS_CLIP:
            raise RuntimeError("CLIP dependencies chưa cài.")

        # Khởi tạo model CLIP một lần để tái sử dụng cho nhiều request.
        # Load CLIP model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            self.MODEL_NAME, pretrained=self.PRETRAINED, device=self.device
        )
        self.model.eval()

        # Cache lưu embeddings: {unique_id: embedding_array}
        # unique_id là item ID (ví dụ: "var_5_0" cho variant 5, image 0)
        self.embeddings_cache = {}
        
        # Metadata: {unique_id: {product_id, variant_id, image_index, ...}}
        # Để mapping từ embedding back to product
        self.metadata_cache = {}
        
        self.description_embeddings_cache = {}
        self._load_cache()
        self._load_metadata()
        self._load_description_cache()

    def _load_cache(self):
        """Load cached embeddings từ disk nếu có."""
        if self.CACHE_DIR.exists():
            try:
                with open(self.CACHE_DIR, "rb") as f:
                    self.embeddings_cache = pickle.load(f)
                print(f"✓ Loaded {len(self.embeddings_cache)} cached image embeddings")
            except Exception as e:
                print(f"[WARN] Failed to load embeddings cache: {e}")

    def _save_cache(self):
        """Lưu embeddings vào disk cho lần sau."""
        self.CACHE_DIR.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.CACHE_DIR, "wb") as f:
                pickle.dump(self.embeddings_cache, f)
            print(f"✓ Saved {len(self.embeddings_cache)} embeddings to cache")
        except Exception as e:
            print(f"[WARN] Failed to save cache: {e}")

    def _load_metadata(self):
        """Load metadata mapping (unique_id -> product_id, etc)."""
        if self.METADATA_CACHE_DIR.exists():
            try:
                with open(self.METADATA_CACHE_DIR, "rb") as f:
                    self.metadata_cache = pickle.load(f)
                print(f"✓ Loaded metadata for {len(self.metadata_cache)} images")
            except Exception as e:
                print(f"[WARN] Failed to load metadata cache: {e}")

    def _save_metadata(self):
        """Lưu metadata vào disk."""
        self.METADATA_CACHE_DIR.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.METADATA_CACHE_DIR, "wb") as f:
                pickle.dump(self.metadata_cache, f)
            print(f"✓ Saved metadata for {len(self.metadata_cache)} images to cache")
        except Exception as e:
            print(f"[WARN] Failed to save metadata cache: {e}")

    def _load_description_cache(self):
        """Load cached description embeddings từ disk nếu có."""
        if self.DESCRIPTION_CACHE_DIR.exists():
            try:
                with open(self.DESCRIPTION_CACHE_DIR, "rb") as f:
                    self.description_embeddings_cache = pickle.load(f)
                print(f"✓ Loaded {len(self.description_embeddings_cache)} cached description embeddings")
            except Exception as e:
                print(f"[WARN] Failed to load description cache: {e}")

    def _save_description_cache(self):
        """Lưu description embeddings vào disk."""
        self.DESCRIPTION_CACHE_DIR.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.DESCRIPTION_CACHE_DIR, "wb") as f:
                pickle.dump(self.description_embeddings_cache, f)
            print(f"✓ Saved {len(self.description_embeddings_cache)} description embeddings to cache")
        except Exception as e:
            print(f"[WARN] Failed to save description cache: {e}")

    def extract_features(self, image_path: str) -> np.ndarray | None:
        """Extract feature embedding từ image file.

        Args:
            image_path: Đường dẫn tới file ảnh hoặc URL

        Returns:
            numpy array shape (embedding_dim,) hoặc None nếu lỗi
        """
        try:
            # Load image
            if isinstance(image_path, str) and image_path.startswith("http"):
                # Download từ URL
                import urllib.request
                import urllib.parse
                from io import BytesIO
                
                # URL encode để fix khoảng trắng và ký tự đặc biệt
                try:
                    # Tách URL thành phần
                    if "://" in image_path:
                        scheme_rest = image_path.split("://", 1)
                        scheme = scheme_rest[0]
                        rest = scheme_rest[1]
                        
                        if "/" in rest:
                            host_path = rest.split("/", 1)
                            host = host_path[0]
                            path = "/" + host_path[1]
                            # Quote path nhưng không quote /
                            path = urllib.parse.quote(path, safe='/')
                            image_path = f"{scheme}://{host}{path}"
                    
                    print(f"[DEBUG] Encoded URL: {image_path[:80]}...")
                except Exception as e:
                    print(f"[WARN] Failed to encode URL: {e}")
                
                with urllib.request.urlopen(image_path, timeout=5) as resp:
                    image_data = BytesIO(resp.read())
                image = Image.open(image_data).convert("RGB")
            else:
                image = Image.open(image_path).convert("RGB")

            # Preprocess
            image_input = self.preprocess(image).unsqueeze(0).to(self.device)

            # Extract features
            with torch.no_grad():
                image_features = self.model.encode_image(image_input)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)

            return image_features.cpu().numpy()[0]
        except Exception as e:
            print(f"[Error] Failed to extract features from {image_path}: {type(e).__name__}: {str(e)[:50]}")
            return None

    def cache_product_embeddings(self, products: list[dict], max_retries: int = 1):
        """Pre-compute embeddings cho tất cả variant images trong DB.

        Args:
            products: List of dicts với keys: id (unique ID), product_id, image (URL hoặc local path)
                     Ví dụ: {id: "var_5_0", product_id: 5, image: "http://..."}
            max_retries: Số lần thử lại nếu lỗi
        """
        success_count = 0
        failed_items = []
        total = len(products)
        
        for idx, product in enumerate(products, 1):
            item_id = product.get("id")  # Unique ID cho item này (ví dụ: var_5_0)
            product_id = product.get("product_id")  # Product ID để group by
            image_url = product.get("image")

            if not item_id or not product_id or not image_url:
                continue

            if item_id in self.embeddings_cache:
                success_count += 1
                if idx % 100 == 0:
                    print(f"  Progress: {idx}/{total} (cached: {success_count})", end='\r')
                continue  # Đã có cached

            # Try to extract with retries
            embedding = None
            for attempt in range(max_retries + 1):
                embedding = self.extract_features(image_url)
                if embedding is not None:
                    break
                if attempt < max_retries:
                    print(f"  Retry {attempt + 1}/{max_retries} for {item_id}...")
            
            if embedding is not None:
                self.embeddings_cache[item_id] = embedding
                # Lưu metadata để map item_id back to product_id
                self.metadata_cache[item_id] = {
                    "product_id": product_id,
                    "variant_id": product.get("variant_id"),
                    "image_index": product.get("image_index"),
                }
                success_count += 1
            else:
                failed_items.append((item_id, image_url))
            
            # Progress update
            if idx % 100 == 0:
                print(f"  Progress: {idx}/{total} (cached: {success_count})", end='\r')

        self._save_cache()
        self._save_metadata()
        
        # Summary
        print(f"\n✓ Cached embeddings for {success_count}/{len(products)} images")
        if failed_items:
            print(f"✗ Failed to cache {len(failed_items)} images:")
            for item_id, url in failed_items[:5]:  # Show first 5
                print(f"  - {item_id}: {url[:60]}...")
            if len(failed_items) > 5:
                print(f"  ... and {len(failed_items) - 5} more")

    def cache_product_descriptions(self, products: list[dict]):
        """Encode product names/descriptions và lưu embeddings.
        
        Args:
            products: List of dicts với keys: id, name, brand, specification
        """
        if not HAS_CLIP:
            print("[WARN] CLIP không được cài. Skip description encoding.")
            return

        from open_clip import tokenize
        
        success_count = 0
        for idx, product in enumerate(products, 1):
            product_id = product.get("id")
            name = product.get("name", "")
            brand = product.get("brand", "")
            spec = product.get("specification", "")
            
            if not product_id:
                continue
            
            if product_id in self.description_embeddings_cache:
                success_count += 1
                continue
            
            # Combine name + brand + specification để mô tả sản phẩm
            description = f"{brand} {name} {spec}".strip()
            if not description:
                continue
            
            try:
                # Encode text using CLIP
                with torch.no_grad():
                    text_tokens = tokenize([description]).to(self.device)
                    text_features = self.model.encode_text(text_tokens)
                    # Normalize
                    text_features = text_features / text_features.norm(dim=-1, keepdim=True)
                    embedding = text_features.cpu().numpy()[0]
                
                self.description_embeddings_cache[product_id] = embedding
                success_count += 1
                
                if idx % 10 == 0:
                    print(f"  Processed {idx}/{len(products)} products...")
            except Exception as e:
                print(f"  [Error] Failed to encode product {product_id}: {e}")
        
        self._save_description_cache()
        print(f"\n✓ Cached descriptions for {success_count}/{len(products)} products")

    def search(
        self,
        query_image_path: str,
        threshold: float = 0.5,
        top_n: int = 1
    ) -> list[tuple[int, float]]:
        """Tìm sản phẩm tương tự với ảnh query.

        Args:
            query_image_path: Đường dẫn tới ảnh cần search
            threshold: Min similarity (0-1). Nếu max similarity < threshold → not found
            top_n: Số kết quả trả về (mặc định 1)

        Returns:
            List of (product_id, similarity_score) sắp xếp theo similarity giảm dần
            (Chỉ return max similarity per product, không return duplicates)
            Nếu không tìm thấy hoặc similarity < threshold → []
        """
        if not self.embeddings_cache:
            return []

        # Extract features từ query image
        query_embedding = self.extract_features(query_image_path)
        if query_embedding is None:
            return []

        # Tính similarity với tất cả cached embeddings (variant images)
        # Gom theo product_id để một sản phẩm chỉ xuất hiện một lần trong kết quả.
        # similarities[item_id] = similarity_score
        similarities_by_item = {}
        for item_id, product_embedding in self.embeddings_cache.items():
            # Cosine similarity
            similarity = np.dot(query_embedding, product_embedding)
            if similarity >= threshold:
                similarities_by_item[item_id] = similarity

        # Group by product_id: lấy max similarity per product
        # 1 sản phẩm có thể có nhiều ảnh (nhiều màu/góc chụp), nên chỉ giữ điểm cao nhất
        # để tránh một product chiếm quá nhiều slot trong top_k.
        similarities_by_product = {}
        for item_id, similarity in similarities_by_item.items():
            # Get product_id từ metadata
            metadata = self.metadata_cache.get(item_id)
            if metadata:
                product_id = metadata.get("product_id")
                # Lưu product_id với highest similarity
                if product_id not in similarities_by_product:
                    similarities_by_product[product_id] = similarity
                else:
                    similarities_by_product[product_id] = max(
                        similarities_by_product[product_id], similarity
                    )

        # Sort theo similarity giảm dần
        sorted_results = sorted(
            similarities_by_product.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]

        return sorted_results
