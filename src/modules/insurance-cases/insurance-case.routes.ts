export function getInsuranceCasePhotoViewUrl(photoId: string) {
  return `/api/insurance-cases/photos/${encodeURIComponent(photoId)}`;
}
