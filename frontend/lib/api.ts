const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

export type BeautyAnalysis = {
  face_shape: string;
  eye_shape: string;
  skin_color: string;
  style_type: string;
  advantage: string;
  improvement: string;
  quality: {
    passed: boolean;
    message: string;
  };
  metrics: FaceMetrics;
  recommendations?: BloggerRecommendation[];
};

export type FaceMetrics = {
  face_length_width_ratio: number;
  jaw_cheekbone_width_ratio: number;
  upper_face_cheekbone_ratio: number;
  lower_face_ratio: number;
  eye_spacing_face_width_ratio: number;
  eye_aspect_ratio: number;
  nose_width_ratio: number;
  lip_width_ratio: number;
  brow_lip_ratio: number;
};

export type BeautyReport = BeautyAnalysis;

export type BloggerRecommendation = {
  name: string;
  match: number;
  avatar_url?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  reasons: string[];
  learn: string[];
  raw_data?: {
    fans?: string;
    gmv?: string;
    aup?: string;
    avg_total_users?: string;
    avg_play_count?: string;
    rpm?: string;
    lives?: number;
    videos?: number;
    skus?: number;
  };
};

export type MakeupTransfer = {
  your_version: string;
  adjustments: Record<string, string>;
};

export type GrowthRecord = {
  date: string;
  title: string;
  summary: string;
  tags: string[];
};

export type ProductRecommendation = {
  name: string;
  category: string;
  reason: string;
  price: number;
};

export type RegisteredUser = {
  id: string;
  phone: string;
  age?: number;
  city?: string;
  membership_level: string;
  analysis_limit: number;
};

export type UploadedImage = {
  image_id: string;
  filename: string;
  content_type: string;
  url: string;
  analyze_url: string;
};

export type BloggerApplicationPayload = {
  reference_type: string;
  platform: string;
  creator_name: string;
  contact_email: string;
  homepage_url: string;
  tutorial_url?: string;
  photo_url?: string;
  selected_content_direction: string[];
  authorization_confirmed: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json() as Promise<UploadedImage>;
}

export async function nextTestCount(): Promise<number> {
  const data = await request<{ count: number }>("/beauty/test-count/next", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data.count;
}

export function analyzeBeauty(imageUrl = "/storage/uploads/front.jpg"): Promise<BeautyAnalysis> {
  return request<BeautyAnalysis>("/beauty/analyze", {
    method: "POST",
    body: JSON.stringify({
      front_image_url: imageUrl,
      angle_image_url: "/storage/uploads/angle.jpg",
      body_image_url: "/storage/uploads/body.jpg",
    }),
  });
}

export function registerUser(payload: { phone: string; age?: number; city?: string }): Promise<RegisteredUser> {
  return request<RegisteredUser>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getBeautyReport(): Promise<BeautyReport> {
  return request<BeautyReport>("/beauty/report");
}

export async function getBloggerRecommendations(): Promise<BloggerRecommendation[]> {
  const data = await request<{ items: BloggerRecommendation[] }>("/recommend/bloggers");
  return data.items;
}

export function submitBloggerApplication(payload: BloggerApplicationPayload): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>("/admin/blogger-applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function transferMakeup(): Promise<MakeupTransfer> {
  return request<MakeupTransfer>("/beauty/makeup-transfer", {
    method: "POST",
    body: JSON.stringify({ creator_image_url: "/storage/uploads/creator.jpg" }),
  });
}

export function getGrowthRecords(): Promise<GrowthRecord[]> {
  return request<GrowthRecord[]>("/growth/records");
}

export async function getProductRecommendations(): Promise<ProductRecommendation[]> {
  const data = await request<{ items: ProductRecommendation[] }>("/recommend/products");
  return data.items;
}
