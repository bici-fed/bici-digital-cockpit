// 获取标签列表
// export const getTagsList = (request, params, token) => {
//  // console.log('params===',params)
//   return request.post(`/applications/service/remote/tag/list`, {
//     ...params,
//     headers: { token },
//   });
// };
export const getTagsList = (request, params, token) => {
  // console.log('params===',params)
  return request.post(`/applications/service/remote/newBoard/tag`, {
    ...params,
    headers: { token },
  });
};


// 删除标签
export const deleteTags = (request, params, token) => {
  return request.post(`/applications/service/remote/tag/delete`, params, {
    headers: { token },
  });
};

// 保存标签
export const saveTags = (request, params, token) => {
  return request.post(`/applications/service/remote/tag/save`, params, {
    headers: { token },
  });
};

// 更新标签
export const updateTags = (request, params, token) => {
  return request.post(`/applications/service/remote/tag/update`, params, {
    headers: { token },
  });
};
