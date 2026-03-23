import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
});

// Template APIs
export const uploadTemplate = async (file: File, versionLabel: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("version_label", versionLabel);
  const res = await api.post("/templates/upload", formData);
  return res.data;
};

export const getActiveTemplate = async () => {
  const res = await api.get("/templates/active");
  return res.data;
};

export const listTemplates = async () => {
  const res = await api.get("/templates/");
  return res.data;
};

export const checkTemplate = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/templates/check", formData);
  return res.data;
};

// Product APIs
export const createProduct = async (data: any) => {
  const res = await api.post("/products/", data);
  return res.data;
};

export const listProducts = async () => {
  const res = await api.get("/products/");
  return res.data;
};

export const getProduct = async (id: number) => {
  const res = await api.get(`/products/${id}`);
  return res.data;
};

export const updateProduct = async (id: number, data: any) => {
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: number) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// Variation APIs
export const addVariation = async (productId: number, data: any) => {
  const res = await api.post(`/products/${productId}/variations`, data);
  return res.data;
};

export const updateVariation = async (
  productId: number,
  variationId: number,
  data: any
) => {
  const res = await api.put(
    `/products/${productId}/variations/${variationId}`,
    data
  );
  return res.data;
};

export const deleteVariation = async (
  productId: number,
  variationId: number
) => {
  const res = await api.delete(
    `/products/${productId}/variations/${variationId}`
  );
  return res.data;
};

export const bulkAddVariations = async (productId: number, variations: any[]) => {
  const res = await api.post(`/products/${productId}/variations/bulk`, {
    variations,
  });
  return res.data;
};

// Export APIs
export const exportProduct = async (productId: number) => {
  const res = await api.post(`/products/${productId}/export`, null, {
    responseType: "blob",
  });
  return res.data;
};

export const previewProduct = async (productId: number) => {
  const res = await api.post(`/products/${productId}/preview`);
  return res.data;
};

// Draft Sheet APIs
export const downloadDraftSheet = async () => {
  const res = await api.get("/draft-sheet/download", {
    responseType: "blob",
  });
  return res.data;
};

export const uploadDraftSheet = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/draft-sheet/upload", formData);
  return res.data;
};

export default api;
