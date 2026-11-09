import Link from "next/link";
import type { Category } from "@/lib/catalog";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}/`} className="category-card">
      <span className="category-card-top">
        {category.number ? <span className="shelf-no">Shelf {category.number}</span> : <span className="shelf-no">&nbsp;</span>}
      </span>
      <span className="category-card-name">{category.name}</span>
      {category.description && <span className="category-card-desc">{category.description}</span>}
      <span className="category-card-count">
        {category.count} {category.count === 1 ? "book" : "books"}
      </span>
    </Link>
  );
}
