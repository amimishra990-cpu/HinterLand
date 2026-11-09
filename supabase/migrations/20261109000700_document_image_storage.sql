-- Document images (PNG, JPEG, WebP) are processed with OCR, so the private
-- bucket must accept them alongside PDF and DOCX.

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp'
]
where id = 'documents';
