// 上传详情
export const requestUploadDetail = (request, params, token) => {
  return request.get(`/file/service/file/getMappingFile`, { params, headers: { token } });
};

// 批量更新映射id
export const batchFileMappingId = (request, params, token) => {
  return request.post(`/file/service/file/batchMappingId`, params, { headers: { token } });
};

// 删除附件
export const fileDelete = (request, params, token) => {
  return request.get(`/file/service/file/delete`, { params, headers: { token } });
};

// 下载附件
export const downloadById = (request, params, token) => {
  return request.get('/file/service/file/downloadById', { params, headers: { token } });
};
