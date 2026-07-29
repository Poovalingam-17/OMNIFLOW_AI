import api from './axiosConfig';

export interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface RAGQueryResponse {
  answer: string;
  sources: {
    chunkId: number;
    content: string;
  }[];
}

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  const response = await api.post<Document>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<Document[]>('/documents');
  return response.data;
};

export const getDocumentStatus = async (id: number): Promise<{ id: number; status: string; chunkCount: number }> => {
  const response = await api.get<{ id: number; status: string; chunkCount: number }>(`/documents/${id}/status`);
  return response.data;
};

export const queryDocument = async (id: number, question: string): Promise<RAGQueryResponse> => {
  const response = await api.post<RAGQueryResponse>(`/documents/${id}/query`, { question });
  return response.data;
};

export const deleteDocument = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/documents/${id}`);
  return response.data;
};
