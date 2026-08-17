"use client";

import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductRecommendations, type ProductRecommendation } from "../../lib/api";

const fallbackProducts: ProductRecommendation[] = [
  {
    name: "低饱和玫瑰色口红",
    category: "口红",
    reason: "适合偏白肤色和清冷感风格。",
    price: 12900,
  },
];

function formatPrice(price: number) {
  return `¥${(price / 100).toFixed(0)}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecommendation[]>(fallbackProducts);

  useEffect(() => {
    getProductRecommendations()
      .then((items) => setProducts(items.length ? items : fallbackProducts))
      .catch(() => setProducts(fallbackProducts));
  }, []);

  return (
    <main className="page-shell content-page products-page">
      <section className="page-header">
        <p className="eyebrow">V3 · Product Recommend</p>
        <h1>{"商品推荐"}</h1>
        <p className="muted">{"根据脸型、肤色、风格和妆容迁移方案，推荐更适合你的美妆商品。"}</p>
      </section>

      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product.name}>
            <ShoppingBag aria-hidden className="product-icon" />
            <p>{product.category}</p>
            <h2>{product.name}</h2>
            <span>{product.reason}</span>
            <strong>{formatPrice(product.price)}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
