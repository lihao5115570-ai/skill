const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type BeautyAnalysisResult = {
  face_shape: string;
  eye_shape: string;
  skin: string;
  style: string;
};

export async function getHealth(): Promise<{ ok: boolean }> {
  const response = await fetch(`${apiBaseUrl}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function analyzeBeautyPhotos(files: {
  frontFace: File;
  angle45: File;
  fullBody: File;
}): Promise<BeautyAnalysisResult> {
  const formData = new FormData();
  formData.append("front_face", files.frontFace);
  formData.append("angle_45", files.angle45);
  formData.append("full_body", files.fullBody);

  const response = await fetch(`${apiBaseUrl}/beauty/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("\u7167\u7247\u5206\u6790\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u56fe\u7247\u540e\u91cd\u8bd5");
  }

  return response.json();
}

