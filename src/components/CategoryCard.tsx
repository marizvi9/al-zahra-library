import Link from "next/link";
import type { Category } from "@/lib/catalog";
import CategoryCover from "./CategoryCover";

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/explore/${category.slug}/`} className="category-card">
      <CategoryCover slug={category.slug} number={category.number} className="category-card-cover" />
      <span className="category-card-body">
        <span className="category-card-name">{category.name}</span>
        {category.description && <span className="category-card-desc">{category.description}</span>}
        <span className="category-card-count">
          {category.count} {category.count === 1 ? "book" : "books"}
        </span>
      </span>
    </Link>
  );
}
