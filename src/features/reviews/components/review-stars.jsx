import { Star } from "lucide-react";

export function ReviewStars({ rating, size = "sm" }) {
  const iconClassName = size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div
      aria-label={`${rating} out of 5 stars`}
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          className={`${iconClassName} ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          }`}
          key={star}
        />
      ))}
    </div>
  );
}
