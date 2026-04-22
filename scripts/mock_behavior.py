"""
mock_behavior.py - Script to generate realistic user behavior logs.
Actions: view, like, add_to_cart, purchase, review_rating, return.

Behavior logic:
- Assign each user one primary preferred category.
- Product choice per interaction: 85% from primary category, 15% from all products.
- Funnel probabilities:
    view (always) -> like 30% -> add_to_cart 20% -> purchase 50% (if in cart)
    after purchase: review_rating 40%, return 5%

System fit:
- user_behavior_logs uses columns: user_id, product_id, action, extra_info, timestamp
- review_rating stores rating in extra_info.rating
- by default script replaces old logs unless --append is used
"""

from __future__ import annotations

import argparse
import json
import os
import random
from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

import mysql.connector

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


# ------------------------------ Config -------------------------------------
SOURCE_TAG = "mock_behavior_py_v2"
DAYS_AGO = 60
NUM_INTERACTIONS_PER_USER = (10, 50)
BATCH_SIZE = 5000

PRIMARY_CATEGORY_PROB = 0.85

# Funnel probabilities
PROB_LIKE = 0.30
PROB_CART = 0.20
PROB_PURCHASE = 0.50
PROB_REVIEW = 0.40
PROB_RETURN = 0.05


def load_env_files() -> None:
    if not load_dotenv:
        return

    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(script_dir, "..", "backend", ".env"),
        os.path.join(script_dir, "..", ".env"),
        os.path.join(script_dir, ".env"),
    ]

    for env_path in candidates:
        env_path = os.path.normpath(env_path)
        if os.path.exists(env_path):
            load_dotenv(env_path)
            break


def get_db_config() -> Dict[str, str]:
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "shoestore"),
        "charset": "utf8mb4",
    }


def random_date(days_ago: int) -> datetime:
    now = datetime.now()
    random_days = random.randint(0, days_ago)
    random_seconds = random.randint(0, 86399)
    return now - timedelta(days=random_days, seconds=random_seconds)


def rating_to_score(rating: int) -> int:
    if rating >= 5:
        return 4
    if rating == 4:
        return 2
    if rating == 3:
        return 0
    if rating == 2:
        return -2
    return -4


def load_users(cursor, max_users: int | None) -> List[int]:
    query = "SELECT id FROM users ORDER BY id"
    if max_users and max_users > 0:
        query += " LIMIT %s"
        cursor.execute(query, (max_users,))
    else:
        cursor.execute(query)

    return [row["id"] for row in cursor.fetchall()]


def load_products_and_groups(cursor) -> Tuple[Dict[str, List[int]], List[int]]:
    cursor.execute("SHOW COLUMNS FROM products")
    product_columns = {row["Field"] for row in cursor.fetchall()}

    if "category_id" in product_columns:
        cursor.execute("SELECT id, category_id FROM products")
        rows = cursor.fetchall()
        groups: Dict[str, List[int]] = {}
        all_ids: List[int] = []

        for row in rows:
            pid = row["id"]
            cid = row["category_id"]
            all_ids.append(pid)
            key = f"cat_{cid}" if cid is not None else f"unknown_{pid % 7}"
            groups.setdefault(key, []).append(pid)

        return groups, all_ids

    # Fallback for very old schema
    cursor.execute("SELECT id FROM products")
    rows = cursor.fetchall()
    groups = {}
    all_ids = []

    for row in rows:
        pid = row["id"]
        all_ids.append(pid)
        key = f"fallback_{pid % 7}"
        groups.setdefault(key, []).append(pid)

    return groups, all_ids


def append_log(
    logs: List[Tuple[int, int, str, str, datetime]],
    user_id: int,
    product_id: int,
    action: str,
    extra_info: Dict,
    event_time: datetime,
) -> None:
    logs.append(
        (
            user_id,
            product_id,
            action,
            json.dumps(extra_info, ensure_ascii=False),
            event_time,
        )
    )


def generate_logs_for_user(
    user_id: int,
    primary_group: str,
    groups: Dict[str, List[int]],
    all_products: List[int],
) -> List[Tuple[int, int, str, str, datetime]]:
    logs: List[Tuple[int, int, str, str, datetime]] = []
    primary_products = groups.get(primary_group, [])

    num_interactions = random.randint(*NUM_INTERACTIONS_PER_USER)
    for interaction_index in range(1, num_interactions + 1):
        if random.random() < PRIMARY_CATEGORY_PROB and primary_products:
            selected_product = random.choice(primary_products)
            from_primary = True
        else:
            selected_product = random.choice(all_products)
            from_primary = selected_product in primary_products

        base_time = random_date(DAYS_AGO)

        # Always view
        append_log(
            logs,
            user_id,
            selected_product,
            "view",
            {
                "source": SOURCE_TAG,
                "interaction": interaction_index,
                "stage": "view",
                "primary_group": primary_group,
                "from_primary_group": from_primary,
            },
            base_time,
        )

        current_time = base_time + timedelta(seconds=random.randint(10, 60))

        # Like with 30%
        if random.random() < PROB_LIKE:
            append_log(
                logs,
                user_id,
                selected_product,
                "like",
                {
                    "source": SOURCE_TAG,
                    "interaction": interaction_index,
                    "stage": "like",
                },
                current_time,
            )
            current_time += timedelta(seconds=random.randint(5, 20))

        # Add to cart with 20%
        if random.random() < PROB_CART:
            append_log(
                logs,
                user_id,
                selected_product,
                "add_to_cart",
                {
                    "source": SOURCE_TAG,
                    "interaction": interaction_index,
                    "stage": "add_to_cart",
                },
                current_time,
            )
            current_time += timedelta(minutes=random.randint(1, 10))

            # Purchase with 50% if in cart
            if random.random() < PROB_PURCHASE:
                append_log(
                    logs,
                    user_id,
                    selected_product,
                    "purchase",
                    {
                        "source": SOURCE_TAG,
                        "interaction": interaction_index,
                        "stage": "purchase",
                    },
                    current_time,
                )
                current_time += timedelta(days=random.randint(2, 7))

                # Review with 40% after purchase
                if random.random() < PROB_REVIEW:
                    rating = random.choices([5, 4, 3, 2, 1], weights=[50, 30, 10, 5, 5])[0]
                    append_log(
                        logs,
                        user_id,
                        selected_product,
                        "review_rating",
                        {
                            "source": SOURCE_TAG,
                            "interaction": interaction_index,
                            "stage": "review_rating",
                            "rating": rating,
                            "rating_score": rating_to_score(rating),
                        },
                        current_time,
                    )
                    current_time += timedelta(hours=random.randint(1, 5))

                # Return with 5% after purchase
                if random.random() < PROB_RETURN:
                    append_log(
                        logs,
                        user_id,
                        selected_product,
                        "return",
                        {
                            "source": SOURCE_TAG,
                            "interaction": interaction_index,
                            "stage": "return",
                            "reason": "mock_return",
                        },
                        current_time,
                    )

    return logs


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate realistic mock behavior logs")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append data instead of replacing existing user_behavior_logs",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate and summarize logs without inserting into DB",
    )
    parser.add_argument(
        "--max-users",
        type=int,
        default=0,
        help="Limit number of users to seed (0 = all eligible users)",
    )
    args = parser.parse_args()

    random.seed(args.seed)
    load_env_files()

    print("Connecting to database...")
    conn = mysql.connector.connect(**get_db_config())
    cursor = conn.cursor(dictionary=True)

    try:
        users = load_users(cursor, args.max_users if args.max_users > 0 else None)
        if not users:
            print("No users found. Please create users first.")
            return

        groups, all_products = load_products_and_groups(cursor)
        if not all_products:
            print("No products found. Please seed products first.")
            return

        group_keys = [k for k, v in groups.items() if v]
        if not group_keys:
            print("No valid product groups found.")
            return

        if not args.append and not args.dry_run:
            print("Replacing old logs in user_behavior_logs...")
            try:
                cursor.execute("TRUNCATE TABLE user_behavior_logs")
            except mysql.connector.Error:
                cursor.execute("DELETE FROM user_behavior_logs")
            conn.commit()

        print(f"Generating behavior logs for {len(users)} users...")
        logs_to_insert: List[Tuple[int, int, str, str, datetime]] = []

        for user_id in users:
            primary_group = random.choice(group_keys)
            user_logs = generate_logs_for_user(
                user_id=user_id,
                primary_group=primary_group,
                groups=groups,
                all_products=all_products,
            )
            logs_to_insert.extend(user_logs)

        # Keep stable chronological order
        logs_to_insert.sort(key=lambda x: (x[0], x[4], x[2], x[1]))

        action_counter = Counter([row[2] for row in logs_to_insert])
        print(f"Generated {len(logs_to_insert)} logs")
        print(f"By action: {dict(action_counter)}")

        if args.dry_run:
            print("Dry-run mode: no data inserted.")
            return

        if not logs_to_insert:
            print("No logs generated.")
            return

        insert_query = """
            INSERT INTO user_behavior_logs (user_id, product_id, action, extra_info, `timestamp`)
            VALUES (%s, %s, %s, %s, %s)
        """

        for i in range(0, len(logs_to_insert), BATCH_SIZE):
            batch = logs_to_insert[i : i + BATCH_SIZE]
            cursor.executemany(insert_query, batch)
            conn.commit()
            print(f"Inserted {i + len(batch)} / {len(logs_to_insert)}")

        print("Done. Mock behavior logs inserted successfully.")

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
