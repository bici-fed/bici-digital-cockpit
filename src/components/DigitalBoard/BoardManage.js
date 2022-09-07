import React, { useState, useEffect, useCallback } from 'react';
import { Space, Modal, Tag, Popconfirm, Tooltip } from 'antd';
import { biciNotification, ComplexTable } from 'bici-transformer';
import { getEncryption } from '@/utils/index';
import { deleteBoard, orderBoard, fetchBoardList } from '@/apis/board';
import _ from 'lodash';
import BiciDraggableModal from '../BiciDraggableModal';

const initialQueryParams = {
  code: '', // 看板编号
  name: '', // 看板名称
  tagName: '', // 标签name
  pagination: {
    // 分页信息
    current: 1,
    pageSize: 10,
    showQuickJumper: false,
  },
};

const BoardManage = (props) => {
  const {
    useTag,
    visible,
    delButton,
    requestClient,
    token,
    draggable = false,
    modalProps,
    complexTableProps,
    queryParamsKey,
    routePrefix = '', // 路由前缀
  } = props;

  // 看板列表
  const [dataList, setDataList] = useState([]);
  // 分页相关
  const [page, setPage] = useState({});
  // 能否移动过
  const [isMove, setIsMove] = useState(false);

  // 请求所有面板数据
  const requestBoardList = useCallback(async (params) => {
    const queryParams = JSON.parse(localStorage.getItem(queryParamsKey));
    const isQueryParamsEmpty = _.isEmpty(queryParams);
    const distQueryParams = isQueryParamsEmpty ? initialQueryParams : queryParams;
    const { pagination } = distQueryParams;
    const distParams = {
      ...distQueryParams,
      pagination: { ...pagination, current: 1 },
      ...params,
    };
    const { list, total, totalPage } = await fetchBoardList(requestClient, distParams, token);
    // 存入redux的查询参数
    localStorage.setItem(queryParamsKey, JSON.stringify(distParams));
    distParams.pagination.total = total;
    distParams.pagination.totalPage = totalPage;
    setPage(distParams.pagination);
    setDataList(() => list || []);
  }, []);

  useEffect(() => {
    requestBoardList();
  }, [requestBoardList]);

  // 表格数据发生变化
  const handleTableChange = (pagination) => {
    const queryParams = JSON.parse(localStorage.getItem(queryParamsKey));
    // const { queryParams } = store.getState().board;
    const distParams = { ...queryParams, pagination };
    requestBoardList(distParams);
  };
  // 筛选条件改变的回调
  const handleFilterTagsChange = (filterTags) => {
    const queryParams = JSON.parse(localStorage.getItem(queryParamsKey));
    // const { queryParams } = store.getState().board;
    const { pagination } = queryParams;
    const copyInitialQueryParams = _.cloneDeep(initialQueryParams);
    const isFilterTagsEmpty = filterTags === null;
    const distPagination = { ...pagination, current: 1 };
    let distParams = {};
    // 标签是否为空
    if (isFilterTagsEmpty) {
      distParams = { ...copyInitialQueryParams, pagination: { ...distPagination } };
    } else {
      let { dataIndex } = filterTags;
      if (dataIndex === 'typeName') {
        dataIndex = 'tagName';
      }
      distParams = { [dataIndex]: '', pagination: { ...distPagination } };
    }

    requestBoardList(distParams);
  };
  // 回溯查询条件，还原成标签
  const getInitialFilterTags = () => {
    const queryParams = JSON.parse(localStorage.getItem(queryParamsKey));
    // const { queryParams } = store.getState().board;
    const isQueryParamsEmpty = _.isEmpty(queryParams);
    let filterTags = [];
    if (!isQueryParamsEmpty) {
      const { code, name, tagName } = queryParams;
      code && filterTags.push({ filterType: 'search', dataIndex: 'code', val: code });
      name && filterTags.push({ filterType: 'search', dataIndex: 'name', val: name });
      tagName && filterTags.push({ filterType: 'search', dataIndex: 'typeName', val: tagName });
    }
    return filterTags;
  };

  // 删除
  const confirmDelete = async (item) => {
    if (item.updateAuth !== 1) {
      biciNotification.error({ message: '无权删除该看板!' });
      return;
    }

    const res = await deleteBoard(requestClient, { id: item.id }, token);
    if (res) {
      biciNotification.success({ message: '删除成功!' });
      requestBoardList();
      props.requestBoardList();
      props.requestTypeList();
    } else {
      biciNotification.error({ message: '删除失败!' });
    }
  };

  // 关闭模态框 刷新
  const handleModal = () => {
    props.onClose();
    if (isMove) {
      // 如果移动过，关闭后刷新页面列表
      props.requestBoardList();
    }
  };

  // 前移
  const onMoveUp = (index) => {
    let dataTemp = _.cloneDeep(dataList);
    if (index !== 0) {
      // 当前对象的排序值
      const params = {
        newCockpitPersonalOrderList: [
          {
            newCockpitBoardId: dataTemp[index].id,
            personalOrder: dataTemp[index - 1].personalOrder,
          },
          {
            newCockpitBoardId: dataTemp[index - 1].id,
            personalOrder: dataTemp[index].personalOrder,
          },
        ],
      };
      // 排序
      orderBoard(requestClient, params, token).then((res) => {
        if (res) {
          console.log('page', page);
          requestBoardList({
            pagination: { current: page.current, pageSize: page.pageSize },
          });
          setIsMove(true);
        }
      });
    } else {
      // 获取前一页数据，和最后一个换
      fetchBoardList(
        requestClient,
        {
          pagination: { current: page.current - 1, pageSize: page.pageSize },
        },
        token,
      ).then((res) => {
        const prePageList = res.list;

        const params = {
          newCockpitPersonalOrderList: [
            {
              newCockpitBoardId: dataTemp[index].id,
              personalOrder: prePageList[prePageList.length - 1].personalOrder,
            },
            {
              newCockpitBoardId: prePageList[prePageList.length - 1].id,
              personalOrder: dataTemp[index].personalOrder,
            },
          ],
        };

        // 排序
        orderBoard(requestClient, params, token).then((res) => {
          if (res) {
            requestBoardList({
              pagination: { current: page.current, pageSize: page.pageSize },
            });
            setIsMove(true);
          }
        });
      });
    }
  };
  // 后移
  const onMoveDown = (index) => {
    let dataTemp = _.cloneDeep(dataList);
    if (index !== dataTemp.length - 1) {
      // 当前对象的排序值
      const params = {
        newCockpitPersonalOrderList: [
          {
            newCockpitBoardId: dataTemp[index].id,
            personalOrder: dataTemp[index + 1].personalOrder,
          },
          {
            newCockpitBoardId: dataTemp[index + 1].id,
            personalOrder: dataTemp[index].personalOrder,
          },
        ],
      };
      // 排序
      orderBoard(requestClient, params, token).then((res) => {
        if (res) {
          requestBoardList({
            pagination: { current: page.current, pageSize: page.pageSize },
          });
          setIsMove(true);
        }
      });
    } else {
      // 获取后一页数据 第一个和最后一个换
      fetchBoardList(
        requestClient,
        {
          pagination: { current: page.current + 1, pageSize: page.pageSize },
        },
        token,
      ).then((res) => {
        const nextPageList = res.list;

        const params = {
          newCockpitPersonalOrderList: [
            {
              newCockpitBoardId: dataTemp[index].id,
              personalOrder: nextPageList[0].personalOrder,
            },
            {
              newCockpitBoardId: nextPageList[0].id,
              personalOrder: dataTemp[index].personalOrder,
            },
          ],
        };

        // 排序
        orderBoard(requestClient, params, token).then((res) => {
          if (res) {
            requestBoardList({
              pagination: { current: page.current, pageSize: page.pageSize },
            });
            setIsMove(true);
          }
        });
      });
    }
  };

  // 列
  let columns = [
    {
      title: '编号',
      dataIndex: 'code',
      width: 'lg',
      filterType: 'search',
      handleSubmitSearch: (val) => requestBoardList({ code: val }),
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '标题',
      dataIndex: 'name',
      width: 'lg',
      filterType: 'search',
      ellipsis: true,
      handleSubmitSearch: (val) => requestBoardList({ name: val }),
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      width: 'lg',
      filterType: 'search',
      ellipsis: true,
      handleSubmitSearch: (val) => requestBoardList({ tagName: val }),
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text?.split(';').map((tag, i) => {
            return (
              <Tag color="blue" key={i} className="mt4">
                {tag}
              </Tag>
            );
          })}
        </Tooltip>
      ),
    },
    {
      title: '链接',
      dataIndex: 'links',
      width: 'lg',
      ellipsis: true,
      render: (text, record) => (
        <Tooltip
          placement="topLeft"
          title={`${window.location.origin}${routePrefix}/newCockpit/${getEncryption(
            JSON.stringify({ id: record.id, isShare: false }),
          )}`}
        >
          <a className="cursorDefault">{`${window.location.origin}${routePrefix}/newCockpit/${getEncryption(
            JSON.stringify({ id: record.id, isShare: false }),
          )}`}</a>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'operation',
      render: (text, record, index) => (
        <Space size="middle">
          {page.current === 1 && index === 0 ? (
            <a style={{ pointerEvents: 'none', opacity: 0.3 }}>前移</a>
          ) : (
            <a onClick={() => onMoveUp(index)}>前移</a>
          )}
          {page.current === page.totalPage && index === dataList.length - 1 ? (
            <a style={{ pointerEvents: 'none', opacity: 0.3 }}>后移</a>
          ) : (
            <a onClick={() => onMoveDown(index)}>后移</a>
          )}
          {delButton && (
            <Popconfirm title="确定删除看板？" onConfirm={() => confirmDelete(record)} okText="是" cancelText="否">
              <a style={{ color: '#f5222d' }}>删除</a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!useTag) columns.splice(2, 1);

  const ModalWrapper = draggable ? BiciDraggableModal : Modal;

  return (
    <ModalWrapper
      forceRender
      title="看板管理"
      visible={visible}
      onCancel={handleModal}
      footer={null}
      width={1200}
      {...modalProps}
    >
      <ComplexTable
        columns={columns}
        rowKey="id"
        minWidth={600}
        dataSource={dataList}
        pagination={page}
        onChange={handleTableChange}
        initialFilterTags={getInitialFilterTags()}
        onFilterTagsChange={handleFilterTagsChange}
        {...complexTableProps}
      />
    </ModalWrapper>
  );
};

export default BoardManage;
