import { OCCUPANCY_BUCKET_MINUTES } from "@/features/bookings/constants";

function floorToBucket(date) {
  const bucketMs = OCCUPANCY_BUCKET_MINUTES * 60 * 1000;
  return new Date(Math.floor(date.getTime() / bucketMs) * bucketMs);
}

export function createOccupancyBuckets(startsAt, endsAt) {
  const bucketMs = OCCUPANCY_BUCKET_MINUTES * 60 * 1000;
  const buckets = [];

  for (
    let cursor = floorToBucket(startsAt).getTime();
    cursor < endsAt.getTime();
    cursor += bucketMs
  ) {
    buckets.push(new Date(cursor));
  }

  return buckets;
}

