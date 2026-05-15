// UploadThing Integration
// Uses @uploadthing/react components and uploadthing/client for uploads

// Re-export the custom dropzone component
export { UploadThingDropzone } from '@/components/upload/UploadThingDropzone';
export type { UploadedFile } from '@/components/upload/UploadThingDropzone';

// Re-export the client service for direct API calls
export { uploadThingClientService } from '@/services/uploadThingClientService';
export type { UploadResult, UploadProgress } from '@/services/uploadThingClientService';

// Re-export the original service for backward compatibility
export { uploadThingService } from '@/services/uploadThingService';
