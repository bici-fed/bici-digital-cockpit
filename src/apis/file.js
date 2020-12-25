// 上传详情
export const requestUploadDetail = (request, params, token) => {
  return request.get(`/file/file/getMappingFile`, { params, headers: { token } });
};

// 批量更新映射id
export const batchFileMappingId = (request, params, token) => {
  return request.post(`/file/file/batchMappingId`, params, { headers: { token } });
};

// 删除附件
export const fileDelete = (request, params, token) => {
  return request.get(`/file/file/delete`, { params, headers: { token } });
};

// 保存并更新
