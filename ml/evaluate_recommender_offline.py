"""
Offline evaluation for HybridRecommender using Amazon UK shoes review dataset.

Muc tieu:
- Chuan hoa dataset review -> schema phu hop voi recommender.py
- Danh gia rieng 3 che do: CF-only, CBF-only, Hybrid
- Khong sua doi cac file train/api/recommender hien tai

Cach chay:
  python evaluate_recommender_offline.py
  python evaluate_recommender_offline.py --csv amazon_uk_shoes_products_dataset_2021_12.csv --topk 10

Output:
- In ra bang metric tren console
- Luu file JSON ket qua vao ml/models/evaluation_report.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from recommender import HybridRecommender


DEFAULT_CSV = "amazon_uk_shoes_products_dataset_2021_12.csv"
DEFAULT_TOPK = 10
RANDOM_STATE = 42


# -----------------------------
# Parsing helpers
# -----------------------------

def stable_int_from_text(text: str, max_value: int = 2_000_000_000) -> int:
    """Deterministic string -> positive int id."""
    if text is None:
        text = ""
    digest = hashlib.md5(str(text).strip().lower().encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % max_value + 1


def extract_asin(url: str) -> str:
    """Extract ASIN from Amazon URL, fallback to hash token when not found."""
    if not isinstance(url, str):
        return f"unknown_{stable_int_from_text(str(url))}"

    m = re.search(r"/dp/([A-Z0-9]{10})", url)
    if m:
        return m.group(1)

    # fallback for non-standard links
    return f"unknown_{stable_int_from_text(url)}"


def parse_review_date(text: str) -> pd.Timestamp:
    """Parse strings like 'Reviewed in the United States on 2 June 2020'."""
    if not isinstance(text, str) or not text.strip():
        return pd.NaT

    m = re.search(r"on\s+(.+)$", text.strip(), flags=re.IGNORECASE)
    date_part = m.group(1).strip() if m else text.strip()

    for fmt in (
        "%d %B %Y",
        "%d %b %Y",
        "%B %d, %Y",
        "%b %d, %Y",
        "%d/%m/%Y",
        "%Y-%m-%d",
    ):
        try:
            return pd.Timestamp(datetime.strptime(date_part, fmt))
        except ValueError:
            continue

    # last attempt with pandas parser
    parsed = pd.to_datetime(date_part, errors="coerce")
    return parsed


def parse_helpful_count(text: str) -> int:
    """Convert helpful count text to int."""
    if text is None or (isinstance(text, float) and np.isnan(text)):
        return 0
    s = str(text).strip().lower()
    if not s:
        return 0

    if "one" in s:
        return 1

    m = re.search(r"(\d+)", s)
    if m:
        return int(m.group(1))
    return 0


def infer_brand(product_name: str) -> str:
    """Simple brand extraction: first token before space/comma."""
    if not isinstance(product_name, str) or not product_name.strip():
        return "unknown"
    token = re.split(r"[\s,]+", product_name.strip())[0]
    token = re.sub(r"[^A-Za-z0-9&\-]", "", token)
    return token.lower() if token else "unknown"


def infer_gender(product_name: str) -> str:
    """Map gender text to recommender expected values: male/female/unisex."""
    if not isinstance(product_name, str):
        return "unisex"
    name = product_name.lower()

    female_keys = ["women", "woman", "women's", "girl", "girl's", "ladies"]
    male_keys = ["men", "man's", "men's", "boy", "boy's"]

    has_female = any(k in name for k in female_keys)
    has_male = any(k in name for k in male_keys)

    if has_female and not has_male:
        return "female"
    if has_male and not has_female:
        return "male"
    return "unisex"


def infer_category(product_name: str) -> str:
    """Infer broad shoe category from product title keywords."""
    if not isinstance(product_name, str):
        return "shoes"
    name = product_name.lower()

    keyword_map = {
        "running": "running",
        "sneaker": "sneaker",
        "boot": "boots",
        "wellington": "boots",
        "sandal": "sandals",
        "loafer": "loafers",
        "mule": "mules",
        "flat": "flats",
        "oxford": "oxfords",
        "skate": "skate",
        "slip": "slip-on",
    }
    for kw, cat in keyword_map.items():
        if kw in name:
            return cat
    return "shoes"


def extract_color_tokens(product_name: str) -> List[str]:
    if not isinstance(product_name, str):
        return []
    name = product_name.lower()
    basic_colors = [
        "black", "white", "blue", "red", "green", "pink", "grey", "gray",
        "brown", "beige", "yellow", "orange", "purple", "gold", "silver",
        "tan", "navy", "cognac", "stone",
    ]
    found = [c for c in basic_colors if c in name]
    return sorted(set(found))


def extract_size_token(product_name: str) -> str:
    if not isinstance(product_name, str):
        return ""
    m = re.search(r"(\d+(?:\.\d+)?)\s*(uk|us|eu|child|toddler)", product_name, flags=re.IGNORECASE)
    return m.group(0).lower() if m else ""


def parse_verified_flag(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"true", "1", "yes"}


# -----------------------------
# Dataset normalization
# -----------------------------

def build_products_df(raw: pd.DataFrame) -> pd.DataFrame:
    """Normalize to recommender products schema.

    Required by recommender.fit():
      id, name, price, brand, category, gender, tags, specification
    """
    tmp = raw.copy()
    tmp["asin"] = tmp["url"].apply(extract_asin)

    products = (
        tmp.groupby("asin", as_index=False)
        .agg({
            "product_name": "first",
        })
        .rename(columns={"product_name": "name"})
    )

    products["id"] = products["asin"].apply(lambda x: stable_int_from_text(f"item::{x}"))
    products["brand"] = products["name"].apply(infer_brand)
    products["category"] = products["name"].apply(infer_category)
    products["gender"] = products["name"].apply(infer_gender)

    # No real price in dataset -> neutral default (still keeps recommender schema valid)
    products["price"] = 0.0

    # tags (JSON list string)
    products["tags"] = products.apply(
        lambda r: json.dumps(
            [
                r["brand"],
                r["category"],
                r["gender"],
                *extract_color_tokens(r["name"]),
            ],
            ensure_ascii=True,
        ),
        axis=1,
    )

    # specification (JSON object string)
    products["specification"] = products["name"].apply(
        lambda n: json.dumps(
            {
                "size_hint": extract_size_token(n),
                "title": str(n)[:100],
            },
            ensure_ascii=True,
        )
    )

    return products[["id", "name", "price", "brand", "category", "gender", "tags", "specification"]]


def build_behavior_df(raw: pd.DataFrame, asin_to_pid: Dict[str, int]) -> pd.DataFrame:
    """Create behavior dataframe matching recommender expected schema.

    Output columns:
      user_id, product_id, action, rating, ts
    """
    df = raw.copy()
    df["asin"] = df["url"].apply(extract_asin)
    df["product_id"] = df["asin"].map(asin_to_pid)

    # reviewer_name in this dataset is pseudo user key
    df["user_id"] = df["reviewer_name"].fillna("unknown_user").apply(lambda x: stable_int_from_text(f"user::{x}"))
    df["rating"] = pd.to_numeric(df["review_rating"], errors="coerce").fillna(0.0)
    df["verified_bool"] = df["verified_purchase"].apply(parse_verified_flag)
    df["helpful_num"] = df["helpful_count"].apply(parse_helpful_count)
    df["ts"] = df["review_date"].apply(parse_review_date)

    # Build implicit action from rating for CF branch
    def map_action(r: float, verified: bool) -> str:
        if r >= 4.0:
            return "purchase" if verified else "like"
        if r >= 3.0:
            return "add_to_cart"
        return "return"

    df["action_from_rating"] = df.apply(lambda x: map_action(float(x["rating"]), bool(x["verified_bool"])), axis=1)

    # Event 1: rating event (uses dynamic score mapping in recommender)
    rating_events = df[["user_id", "product_id", "rating", "ts"]].copy()
    rating_events["action"] = "review_rating"

    # Event 2: implicit action from sentiment/rating
    implicit_events = df[["user_id", "product_id", "rating", "ts", "action_from_rating"]].copy()
    implicit_events = implicit_events.rename(columns={"action_from_rating": "action"})

    behavior = pd.concat([rating_events, implicit_events], ignore_index=True)
    behavior = behavior.dropna(subset=["product_id"]).copy()

    behavior["user_id"] = behavior["user_id"].astype(int)
    behavior["product_id"] = behavior["product_id"].astype(int)
    behavior["ts"] = pd.to_datetime(behavior["ts"], errors="coerce")

    # fallback timestamp if parse failed
    min_time = pd.Timestamp("2019-01-01")
    behavior["ts"] = behavior["ts"].fillna(min_time)

    return behavior[["user_id", "product_id", "action", "rating", "ts"]]


# -----------------------------
# Train/test split
# -----------------------------

def leave_one_out_split(behavior: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[int, int]]:
    """Per-user leave-one-out split on positive interactions.

    - Positive target defined by rating >= 4 in review_rating events.
    - For each user: latest positive item -> test target
    - Train uses all events strictly before that target timestamp for user
    """
    work = behavior.copy().sort_values(["user_id", "ts"]).reset_index(drop=True)

    # Candidates from review events only
    positive_reviews = work[(work["action"] == "review_rating") & (work["rating"] >= 4.0)].copy()
    if positive_reviews.empty:
        raise ValueError("Khong co positive review (rating >= 4) de tao tap test.")

    # users with >=2 unique positive items for meaningful evaluation
    pos_counts = positive_reviews.groupby("user_id")["product_id"].nunique()
    valid_users = set(pos_counts[pos_counts >= 2].index)

    positive_reviews = positive_reviews[positive_reviews["user_id"].isin(valid_users)]
    if positive_reviews.empty:
        raise ValueError("Khong du user co >=2 positive items de danh gia leave-one-out.")

    # latest positive per user as ground truth
    test_rows = (
        positive_reviews.sort_values(["user_id", "ts"]) 
        .groupby("user_id", as_index=False)
        .tail(1)
    )

    test_truth: Dict[int, int] = {int(r.user_id): int(r.product_id) for r in test_rows.itertuples()}

    # remove target event and all future events for same user from train
    # Mục tiêu: mô phỏng dự đoán "tại thời điểm trước khi user tương tác item test".
    cutoff_map = {int(r.user_id): r.ts for r in test_rows.itertuples()}

    keep_train = []
    for row in work.itertuples(index=False):
        uid = int(row.user_id)
        ts = row.ts
        if uid not in cutoff_map:
            continue
        keep_train.append(ts < cutoff_map[uid])

    work_valid = work[work["user_id"].isin(cutoff_map.keys())].copy().reset_index(drop=True)
    train = work_valid[np.array(keep_train, dtype=bool)].copy()

    # avoid empty users after split
    train_users = set(train["user_id"].unique())
    test_truth = {uid: pid for uid, pid in test_truth.items() if uid in train_users}
    train = train[train["user_id"].isin(test_truth.keys())].copy()

    # final test dataframe
    test_df = pd.DataFrame(
        [{"user_id": uid, "product_id": pid} for uid, pid in test_truth.items()]
    )

    return train, test_df, test_truth


# -----------------------------
# Metrics
# -----------------------------

def precision_recall_hit_ndcg_map_at_k(recommended: List[int], true_item: int, k: int) -> Dict[str, float]:
    topk = recommended[:k]
    if not topk:
        return {
            "precision": 0.0,
            "recall": 0.0,
            "hit_rate": 0.0,
            "ndcg": 0.0,
            "map": 0.0,
        }

    hit = 1 if true_item in topk else 0
    precision = hit / float(k)
    recall = float(hit)  # 1 relevant item/user
    hit_rate = float(hit)

    if hit:
        rank = topk.index(true_item) + 1
        ndcg = 1.0 / np.log2(rank + 1)
        ap = 1.0 / rank
    else:
        ndcg = 0.0
        ap = 0.0

    return {
        "precision": precision,
        "recall": recall,
        "hit_rate": hit_rate,
        "ndcg": ndcg,
        "map": ap,
    }


def evaluate_model(
    model: HybridRecommender,
    test_truth: Dict[int, int],
    user_context_item: Dict[int, int],
    products_universe: List[int],
    topk: int,
    use_context_for_cbf: bool,
) -> Dict[str, float]:
    per_user = []
    recommended_pool = set()

    for uid, true_item in test_truth.items():
        context_pid = user_context_item.get(uid) if use_context_for_cbf else None
        recs = model.recommend(user_id=int(uid), current_product_id=context_pid, top_n=topk)
        recommended_pool.update(recs)

        metrics = precision_recall_hit_ndcg_map_at_k(recs, int(true_item), topk)
        per_user.append(metrics)

    if not per_user:
        raise ValueError("Khong co user nao du dieu kien de tinh metric.")

    avg = {
        "users_evaluated": float(len(per_user)),
        "precision_at_k": float(np.mean([m["precision"] for m in per_user])),
        "recall_at_k": float(np.mean([m["recall"] for m in per_user])),
        "hit_rate_at_k": float(np.mean([m["hit_rate"] for m in per_user])),
        "ndcg_at_k": float(np.mean([m["ndcg"] for m in per_user])),
        "map_at_k": float(np.mean([m["map"] for m in per_user])),
        "coverage_at_k": float(len(recommended_pool) / max(len(products_universe), 1)),
    }
    return avg


# -----------------------------
# Main pipeline
# -----------------------------

def build_user_context_item(train_behavior: pd.DataFrame) -> Dict[int, int]:
    """Use latest positive train item as context product for CBF/hybrid recommend()."""
    review_pos = train_behavior[
        (train_behavior["action"] == "review_rating") & (train_behavior["rating"] >= 4.0)
    ].copy()
    if review_pos.empty:
        return {}

    latest = (
        review_pos.sort_values(["user_id", "ts"]) 
        .groupby("user_id", as_index=False)
        .tail(1)
    )
    return {int(r.user_id): int(r.product_id) for r in latest.itertuples()}


def run_evaluation(csv_path: str, topk: int) -> Dict[str, Dict[str, float]]:
    print("=" * 72)
    print("OFFLINE EVALUATION - AMAZON UK SHOES DATASET")
    print("=" * 72)

    raw = pd.read_csv(csv_path)
    print(f"[1] Raw rows: {len(raw):,}")

    required_cols = {
        "url", "product_name", "reviewer_name", "review_text", "review_rating",
        "verified_purchase", "review_date", "helpful_count"
    }
    missing = required_cols - set(raw.columns)
    if missing:
        raise ValueError(f"Dataset thieu cot bat buoc: {sorted(missing)}")

    print("[2] Building normalized products_df / behavior_df...")
    products_df = build_products_df(raw)
    # Mapping chính thức dùng pid_map bên dưới (ổn định theo ASIN).
    # Khối asin_to_pid cũ không còn cần trong pipeline hiện tại.
    # use products_df for final mapping to guarantee consistency
    pid_map = {
        extract_asin(url): int(pid)
        for url, pid in zip(raw["url"], raw["url"].apply(lambda u: stable_int_from_text(f"item::{extract_asin(u)}")))
    }
    behavior_df = build_behavior_df(raw, pid_map)

    print(f"    Products: {len(products_df):,}")
    print(f"    Behaviors: {len(behavior_df):,}")

    print("[3] Train/test split (leave-one-out by user)...")
    train_behavior, test_df, test_truth = leave_one_out_split(behavior_df)
    user_context_item = build_user_context_item(train_behavior)

    print(f"    Train events: {len(train_behavior):,}")
    print(f"    Test users: {len(test_truth):,}")

    # Keep products seen in train/test to avoid full-catalog mismatch noise
    used_product_ids = sorted(set(train_behavior["product_id"]).union(set(test_df["product_id"])))
    products_eval = products_df[products_df["id"].isin(used_product_ids)].copy()

    # ensure every test user still has events in train
    train_users = set(train_behavior["user_id"].unique())
    test_truth = {u: i for u, i in test_truth.items() if u in train_users}
    user_context_item = {u: p for u, p in user_context_item.items() if u in test_truth}

    print("[4] Training & Tuning models (CF, CBF, Hybrid Variations)...")
    
    # 1. Khởi tạo danh sách các cấu hình cần test
    # Mỗi cấu hình dưới đây để so sánh cách phối CF và CBF.
    configs = [
        {"name": "cf_only", "cf": 1.0, "cbf": 0.0, "use_context": False},
        {"name": "cbf_only", "cf": 0.0, "cbf": 1.0, "use_context": True},
        {"name": "hybrid_70cf_30cbf", "cf": 0.7, "cbf": 0.3, "use_context": True}, # Cấu hình cũ
        {"name": "hybrid_30cf_70cbf", "cf": 0.3, "cbf": 0.7, "use_context": True}, # Ưu tiên nội dung
        {"name": "hybrid_50_50", "cf": 0.5, "cbf": 0.5, "use_context": True}       # Cân bằng
    ]

    all_metrics = {}
    all_products = list(products_eval["id"])

    print(f"[5] Evaluating @K={topk}...")
    for cfg in configs:
        print(f"    -> Đang đánh giá {cfg['name']}...")
        # Train từng cấu hình riêng rồi lấy metric để so sánh trực tiếp.
        model = HybridRecommender(cf_weight=cfg["cf"], cbf_weight=cfg["cbf"])
        model.fit(products_eval, train_behavior)
        
        metrics = evaluate_model(
            model=model,
            test_truth=test_truth,
            user_context_item=user_context_item,
            products_universe=all_products,
            topk=topk,
            use_context_for_cbf=cfg["use_context"],
        )
        all_metrics[cfg["name"]] = metrics

    result = {
        "config": {
            "csv_path": os.path.abspath(csv_path),
            "topk": topk,
            "random_state": RANDOM_STATE,
            "users_eval": len(test_truth),
            "products_eval": len(products_eval),
            "train_events": len(train_behavior),
        },
        "metrics": all_metrics,
    }

    return result


def print_report(result: Dict[str, Dict[str, float]]) -> None:
    cfg = result["config"]
    metrics = result["metrics"]

    print("\n" + "-" * 72)
    print("DATA SUMMARY")
    print("-" * 72)
    print(f"CSV: {cfg['csv_path']}")
    print(f"Users eval: {cfg['users_eval']} | Products eval: {cfg['products_eval']} | Train events: {cfg['train_events']}")
    print(f"TopK: {cfg['topk']}")

    print("\n" + "-" * 72)
    print("METRICS")
    print("-" * 72)

    headers = [
        "model", "precision@k", "recall@k", "hit_rate@k", "ndcg@k", "map@k", "coverage@k"
    ]
    print(" | ".join(h.ljust(12) for h in headers))
    print("-" * 72)

    for model_name, m in metrics.items():
        row = [
            model_name,
            f"{m['precision_at_k']*100:.2f}%",
            f"{m['recall_at_k']*100:.2f}%",
            f"{m['hit_rate_at_k']*100:.2f}%",
            f"{m['ndcg_at_k']:.4f}",
            f"{m['map_at_k']:.4f}",
            f"{m['coverage_at_k']*100:.2f}%",
        ]
        print(" | ".join(v.ljust(15) for v in row))


def save_report(result: Dict[str, Dict[str, float]], output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Offline evaluation for HybridRecommender on Amazon UK shoes dataset")
    parser.add_argument(
        "--csv",
        default=DEFAULT_CSV,
        help="Path to dataset CSV (default: amazon_uk_shoes_products_dataset_2021_12.csv)",
    )
    parser.add_argument(
        "--topk",
        type=int,
        default=DEFAULT_TOPK,
        help="Top-K for ranking metrics (default: 10)",
    )
    parser.add_argument(
        "--output",
        default=os.path.join("models", "evaluation_report.json"),
        help="Output JSON path (default: models/evaluation_report.json)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    csv_path = args.csv
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(os.path.dirname(__file__), csv_path)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Khong tim thay file dataset: {csv_path}")

    result = run_evaluation(csv_path=csv_path, topk=args.topk)
    print_report(result)

    output_path = args.output
    if not os.path.isabs(output_path):
        output_path = os.path.join(os.path.dirname(__file__), output_path)

    save_report(result, output_path)
    print(f"\nDa luu bao cao: {output_path}")


if __name__ == "__main__":
    main()
