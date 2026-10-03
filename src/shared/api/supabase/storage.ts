/** 도시 사진 버킷 (0006_cities.sql). 공개 버킷이라 URL 만으로 읽힌다. */
export const CITY_IMAGES_BUCKET = "city-images";

/** 공개 버킷 파일의 URL. 클라이언트를 만들지 않고 규칙대로 조립한다. */
export function publicStorageUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
