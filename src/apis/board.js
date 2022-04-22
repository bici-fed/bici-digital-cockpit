// 请求看板列表
export const fetchBoardList = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/list`, params, { headers: { token } });

// 请求所有看板类型
export const fetchTypeList = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/tag`, params, { headers: { token } });

// 看板排序
export const orderBoard = (request, params, token) =>
  request.post(`/applications/service/remote/newBoardOrder/order`, params, {
    headers: { token },
  });

// 新建看板
export const createBoard = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/save`, params, {
    headers: { token },
  });

// 更新看板
export const modifyBoard = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/update`, params, {
    headers: { token },
  });

// 删除看板
export const deleteBoard = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/delete`, params, {
    headers: { token },
  });

  

// 获取看板详情
export const fetchBoardDetail = (request, params, token) =>
  request.get(`/applications/service/remote/newBoard/detail`, { params, headers: { token } });

// 保存看板配置数据
export const updateBoardConfigProp = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/updateProperty`, params, {
    headers: { token },
  });

// 创建看板分享链接
export const createShareLink = (request, params, token) =>
  request.post(`/applications/service/remote/newBoard/saveBoardShareLink`, params, {
    headers: { token },
  });

// 查看分享看板链接是否有密码
export const hasSharePwd = (request, token) =>
  request.get(`/applications/service/remote/newBoard/boardShareLinkExistPassword/${token}`);

// 获取看板分享数据
export const checkSharePwdAndGetData = (request, token, password) =>
  request.get(`/applications/service/remote/newBoard/boardShareLink/${token}`, {
    params: { password },
  });
