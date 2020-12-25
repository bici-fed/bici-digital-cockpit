// 获取标签列表
export const getTagsList = (request, params, token) => {
  return request.get(`/manager/tag/list`, {
    params,
    headers: { token },
  });
};

// 删除标签
export const deleteTags = (request, params, token) => {
  return request.post(`/manager/tag/delete`, params, {
    headers: { token },
  });
};

// 保存标签
export const saveTags = (request, params, token) => {
  return request.post(`/manager/tag/save`, params, {
    headers: { token },
  });
};

// 更新标签
export const updateTags = (request, params, token) => {
  return request.post(`/manager/tag/update`, params, {
    headers: { token },
  });
};
