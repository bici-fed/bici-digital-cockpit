import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DragDropContext } from 'react-dnd';
import { Row, Col, Button, Empty, Input, Radio, Menu, Dropdown, Checkbox, Space, ConfigProvider } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { biciNotification } from 'bici-transformers';
import HTML5Backend from 'react-dnd-html5-backend';
import _ from 'lodash';
import { fetchBoardList, fetchTypeList, orderBoard } from '@/apis/board';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import BoardManage from './BoardManage';
import BoardCreate from './BoardCreate';
import BoardCard from './BoardCard';

import 'antd/dist/antd.less';

import styles from './index.module.css';

const DigitalBoard = (props) => {
  const { token, permissionBtn, userInfo, useTag, requestClient, wrapperStyle, onBoardCreateModalClose } = props;

  // 卡片列占比，默认4列
  const [colSize, setColSize] = useState(6);
  // 卡片高，默认中
  const [colHeight, setColHeight] = useState(310);
  // 看板列表数据
  const [boardList, setBoardList] = useState([]);
  const [tagCheckGroup, setTagCheckGroup] = useState({
    typeList: [],
    indeterminate: false,
    checkAll: true,
  });
  // 标签选择
  const [typeSelect, setTypeSelect] = useState({
    currntSelectedTypes: [], // 当前选择的所有标签
    indexSelected: [], // 显示的checkgroup的标签选择
    hideSelected: [], // 隐藏的checkgroup的标签选择，
    currentHide: [],
  });
  // 展示的标签数据列表
  const [tagShow, setTagShow] = useState({
    indexTypes: [],
    otherTypes: [],
  });
  // 展示看板管理
  const [manageVisible, setManageVisible] = useState(false);
  // 展示新建看板
  const [createVisible, setCreateVisible] = useState(false);
  // 分页参数
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });
  // 搜索信息
  const [searchInfo, setSearchInfo] = useState({
    name: undefined,
    tagIdList: [],
  });
  // tag下来显示
  const [showDropdown, setShowDropdown] = useState(false);

  const boardListRef = useRef();
  const tagMoreRef = useRef();

  useOnClickOutside(tagMoreRef, () => setShowDropdown(false));

  useEffect(() => {
    requestBoardList();
    requestTypeList();
  }, []);

  // 请求所有面板数据
  const requestBoardList = async (params) => {
    const { list, total } = await fetchBoardList(requestClient, { pagination, ...params }, token);
    setBoardList(() => list);
    setPagination((prevState) => ({
      ...prevState,
      total,
    }));
  };

  // 请求所有类型数据
  const requestTypeList = async () => {
    if (!useTag) return;
    const data = await fetchTypeList(requestClient, {}, token);
    const tags = data.map((tag) => {
      return { value: tag.id, label: tag.name };
    });
    setTagCheckGroup({ ...tagCheckGroup, typeList: tags });
    const tagVals = tags.map((item) => item.value);
    if (tags.length >= 5) {
      setTagShow(() => ({
        indexTypes: tags.slice(0, 4),
        otherTypes: tags.slice(4),
      }));
      setTypeSelect(() => ({
        currntSelectedTypes: tagVals,
        indexSelected: tags.slice(0, 4).map((item) => item.value),
        hideSelected: tags.slice(4).map((item) => item.value),
      }));
    } else {
      setTagShow((prevState) => ({ ...prevState, indexTypes: tags.slice(0, 4) }));
      setTypeSelect(() => ({
        currntSelectedTypes: tagVals,
        indexSelected: tags.slice(0, 4).map((item) => item.value),
        hideSelected: [],
      }));
    }

    setSearchInfo({
      ...searchInfo,
      tagIdList: tagVals,
    });
  };

  // 配置面板
  const handleConfigBoard = (item) => {
    if (item.updateAuth === 2 && userInfo.id !== item.createUserId) {
      // 禁止他人编辑  不是本人
      biciNotification.error({
        message: '无权编辑该看板!',
      });
      return;
    }
    props.history.push({
      pathname: `/newBoard/${item.id}`,
    });
  };

  // 模态框取消
  const handleManageClose = useCallback(() => {
    setManageVisible(() => false);
  }, [setManageVisible]);

  const handleCreateClose = useCallback(() => {
    if (onBoardCreateModalClose) onBoardCreateModalClose();
    setCreateVisible(() => false);
  }, [setCreateVisible]);

  // 改变看板布局
  const handleSizeChange = (e) => {
    let pageSize = pagination.pageSize;
    if (Number(e.target.value) === 4) {
      setColHeight(() => 210);
      pageSize = 30;
    }

    if (Number(e.target.value) === 8) {
      setColHeight(() => 410);
      pageSize = 9;
    }

    if (Number(e.target.value) === 6) {
      setColHeight(() => 310);
      pageSize = 12;
    }

    setColSize(Number(e.target.value));
    setPagination({ ...pagination, pageSize });
    requestBoardList({ ...searchInfo, pagination: { ...pagination, pageSize } });
  };
  // 展示的类型选择
  const onTypeChange = (checkedList) => {
    const newSeletedList = [...typeSelect.hideSelected, ...checkedList];
    setTagCheckGroup({
      ...tagCheckGroup,
      indeterminate: !!checkedList.length && newSeletedList.length < tagCheckGroup.typeList.length,
      checkAll: newSeletedList.length === tagCheckGroup.typeList.length,
    });
    setTypeSelect({
      ...typeSelect,
      currntSelectedTypes: newSeletedList,
      indexSelected: checkedList,
    });

    // 后端查询
    if (newSeletedList.length > 0) {
      requestBoardList({ ...searchInfo, tagIdList: newSeletedList });
      setSearchInfo({ ...searchInfo, tagIdList: newSeletedList });
    } else {
      setBoardList([]);
      setSearchInfo({ ...searchInfo, tagIdList: [] });
    }
  };
  // 隐藏类型的选择事件
  const hideTypeChange = (checkedList) => {
    const newSeletedList = [...typeSelect.indexSelected, ...checkedList];
    setTagCheckGroup({
      ...tagCheckGroup,
      indeterminate: !!checkedList.length && newSeletedList.length < tagCheckGroup.typeList.length,
      checkAll: newSeletedList.length === tagCheckGroup.typeList.length,
    });
    //标签选择
    setTypeSelect({
      ...typeSelect,
      currntSelectedTypes: newSeletedList,
      currentHide: checkedList,
    });
  };
  // 选择全部标签
  const onCheckAllChange = (e) => {
    const checkedList = e.target.checked ? tagCheckGroup.typeList.map((item) => item.value) : [];
    setTagCheckGroup((prevState) => ({
      ...prevState,
      indeterminate: false,
      checkAll: e.target.checked,
    }));
    setTypeSelect({
      currntSelectedTypes: checkedList,
      indexSelected: e.target.checked ? tagShow.indexTypes.map((item) => item.value) : [],
      hideSelected: e.target.checked ? tagShow.otherTypes.map((item) => item.value) : [],
    });

    // 后端查询
    if (e.target.checked) {
      requestBoardList({ name: searchInfo.name, tagIdList: checkedList });
      setSearchInfo({ ...searchInfo, tagIdList: checkedList });
    } else {
      setBoardList([]);
      setSearchInfo({ ...searchInfo, tagIdList: [] });
    }
  };

  // 处理标签选择确认
  const handleTagSeletedOk = () => {
    if (typeSelect.currntSelectedTypes.length > 0) {
      requestBoardList({ name: searchInfo.name, tagIdList: typeSelect.currntSelectedTypes });
      setSearchInfo({ ...searchInfo, tagIdList: typeSelect.currntSelectedTypes });
    } else {
      setBoardList([]);
      setSearchInfo({ ...searchInfo, tagIdList: [] });
    }
    setTypeSelect({ ...typeSelect, hideSelected: typeSelect.currentHide });
    setShowDropdown(false);
  };

  // 处理标签选择取消
  const handleTagSeletedCanel = () => {
    setTypeSelect({
      ...typeSelect,
      currntSelectedTypes: searchInfo.tagIdList,
    });

    if (searchInfo.tagIdList.length === tagCheckGroup.typeList.length) {
      setTagCheckGroup({
        ...tagCheckGroup,
        indeterminate: false,
        checkAll: true,
      });
    } else {
      setTagCheckGroup({
        ...tagCheckGroup,
        indeterminate: true,
        checkAll: false,
      });
    }
    // 设置hidelist
    setShowDropdown(false);
  };

  // 滚动加载更多
  const handleScroll = () => {
    if (boardListRef.current.scrollHeight - boardListRef.current.clientHeight > boardListRef.current.scrollTop) {
      return;
    } else {
      if (boardList.length !== pagination.total) {
        const size = colSize === 4 ? 30 : colSize === 6 ? 12 : 9;
        setPagination({ ...pagination, pageSize: pagination.pageSize + size });
        requestBoardList({ pagination: { ...pagination, pageSize: pagination.pageSize + size }, ...searchInfo });
      }
    }
  };

  // 拖拽处理
  const findCard = (id) => {
    const item = boardList.find((c) => c.id === id);
    return {
      item: item,
      index: boardList.indexOf(item),
    };
  };
  const handleMove = (id, toIndex) => {
    const copyList = _.cloneDeep(boardList);
    const { item, index } = findCard(id);
    boardList.splice(index, 1);
    boardList.splice(toIndex, 0, item);
    for (let index = 0; index < copyList.length; index++) {
      boardList[index].personalOrder = copyList[index].personalOrder;
    }
    setBoardList([...boardList]);
    // 数据处理，保存到后台
    orderBoard(
      requestClient,
      {
        newCockpitPersonalOrderList: boardList.map((item) => ({
          newCockpitBoardId: item.id,
          personalOrder: item.personalOrder,
        })),
      },
      token,
    );
  };

  // 渲染下拉选项菜单
  const renderCheckGroup = (
    <div ref={tagMoreRef}>
      <Menu style={{ width: 440 }} selectable={false}>
        <Menu.Item>
          <Checkbox.Group style={{ width: '100%' }} value={typeSelect.currntSelectedTypes} onChange={hideTypeChange}>
            <Row gutter={[16, 16]}>
              {tagShow.otherTypes.map((item, index) => {
                return (
                  <Col span={6} key={item.value} key={index}>
                    <Checkbox
                      value={item.value}
                      style={{
                        width: '12ch',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {item.label}
                    </Checkbox>
                  </Col>
                );
              })}
            </Row>
          </Checkbox.Group>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleTagSeletedCanel}>取消</Button>
            <Button type="primary" onClick={handleTagSeletedOk}>
              确认选择
            </Button>
          </Space>
        </Menu.Item>
      </Menu>
    </div>
  );

  const handleSearchBtn = (value) => {
    const { currntSelectedTypes } = typeSelect;
    const useType = currntSelectedTypes.length > 0;
    const searchParams = useType ? { name: value, tagIdList: currntSelectedTypes } : { name: value };
    requestBoardList(searchParams);
    setSearchInfo({
      ...searchInfo,
      name: value,
    });
  };

  // 渲染工具栏
  const queryForm = () => {
    return (
      <Row style={{ paddingBottom: 20 }} align="middle">
        <Col className={styles.queryForm}>
          <Input.Search
            allowClear
            style={{
              minWidth: 170,
              height: 36,
            }}
            placeholder="请输入看板名称"
            onSearch={(value) => handleSearchBtn(value)}
          />
        </Col>
        {useTag && (
          <>
            <Col
              style={{
                marginLeft: 60,
                borderRight: '1px solid #C4C4C4',
              }}
            >
              <span>展示类型:</span>
              <Checkbox
                style={{ margin: '0 30px' }}
                indeterminate={tagCheckGroup.indeterminate}
                onChange={onCheckAllChange}
                checked={tagCheckGroup.checkAll}
              >
                全选
              </Checkbox>
            </Col>
            <Col style={{ marginLeft: 30 }}>
              <Checkbox.Group
                style={{
                  marginRight: 30,
                }}
                value={typeSelect.currntSelectedTypes}
                onChange={onTypeChange}
              >
                <Row>
                  {tagShow.indexTypes.map((item, index) => (
                    <Checkbox
                      key={index}
                      value={item.value}
                      style={{
                        width: '12ch',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {item.label}
                    </Checkbox>
                  ))}
                </Row>
              </Checkbox.Group>
              {tagShow.otherTypes.length > 0 && (
                <Dropdown overlay={renderCheckGroup} trigger={['click']} visible={showDropdown} placement="bottomRight">
                  <a
                    href="/#"
                    className="ant-dropdown-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDropdown(true);
                    }}
                  >
                    更多 <DownOutlined />
                  </a>
                </Dropdown>
              )}
            </Col>
          </>
        )}
        <Col>
          <span
            style={{
              marginLeft: 60,
              marginRight: 30,
            }}
          >
            卡片大小：
          </span>
          <Radio.Group defaultValue="6" buttonStyle="solid" onChange={handleSizeChange}>
            <Radio.Button value="4">小</Radio.Button>
            <Radio.Button value="6">中</Radio.Button>
            <Radio.Button value="8">大</Radio.Button>
          </Radio.Group>
        </Col>
        <Col className={styles.operation} style={{ flex: '1 0 auto' }}>
          <Button onClick={() => setManageVisible(() => true)}>看板管理</Button>
          {permissionBtn.createButton && (
            <Button className="ml20" type="primary" onClick={() => setCreateVisible(() => true)}>
              新建看板
            </Button>
          )}
        </Col>
      </Row>
    );
  };

  // 渲染看板列表
  const renderBoardList = useMemo(() => {
    return (
      <div style={{ overflowY: 'auto', overflowX: 'hidden' }} ref={boardListRef} onScroll={handleScroll}>
        <Row gutter={[16, 16]} style={{ ...wrapperStyle }}>
          {boardList.map((item, index) => (
            <Col key={index} className={styles.boards} span={colSize} style={{ height: colHeight }}>
              <BoardCard
                item={item}
                id={item.id}
                colSize={colSize}
                findCard={findCard}
                handleMove={handleMove}
                configButton={permissionBtn.configButton}
                handleConfigBoard={handleConfigBoard}
                useTag={useTag}
              />
            </Col>
          ))}
        </Row>
      </div>
    );
  }, [boardList, colHeight, colSize, useTag, permissionBtn, wrapperStyle]);

  return (
    <ConfigProvider prefixCls="antd-bici-cockpit">
      <div style={{ height: '100%', padding: 12, overflow: 'hidden' }} id="capture">
        <div style={{ height: '100%', background: 'white', padding: 12 }}>
          {queryForm()}
          {!_.isEmpty(boardList) ? renderBoardList : <Empty style={{ marginTop: 300 }} description="暂无看板数据" />}
        </div>
        {/* 新建看板 */}
        {createVisible && <BoardCreate visible={createVisible} onClose={handleCreateClose} {...props} />}
        {/* 看板管理 */}
        {manageVisible && (
          <BoardManage
            {...props}
            visible={manageVisible}
            onClose={handleManageClose}
            requestBoardList={requestBoardList}
            requestTypeList={requestTypeList}
            delButton={permissionBtn.delButton}
          />
        )}
      </div>
    </ConfigProvider>
  );
};

export default DragDropContext(HTML5Backend)(DigitalBoard);
