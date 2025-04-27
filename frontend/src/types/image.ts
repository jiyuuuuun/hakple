export interface ImageUploadResponse {
  path: string;
  id: number;
}

export interface Image {
  id: number;
  path: string;
  isTemp: boolean;
  createdAt: string;
} 