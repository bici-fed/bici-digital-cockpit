import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useImperativeHandle,
} from "react";
import { DownOutlined } from "@ant-design/icons";
import {
  Row,
  Col,
  Button,
  Empty,
  Input,
  Radio,
  Menu,
  Dropdown,
  Checkbox,
  Space,
  ConfigProvider,
} from "antd";
import { biciNotification } from "bici-transformers";
import BoardManage from "./BoardManage";
import BoardCreate from "./BoardCreate";
import BoardCard from "./BoardCard";
import { BOARD_QUERY_PARAMS_KEY } from "@/constant/index";
import { fetchBoardList, fetchTypeList, orderBoard } from "@/apis/board";
import { DragDropContext } from "react-dnd";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import HTML5Backend from "react-dnd-html5-backend";
import _ from "lodash";

import "antd/dist/antd.less";

import styles from "./index.module.css";

const DigitalBoard = React.forwardRef((props, ref) => {
  const { token, permissionBtn, userInfo, useTag, requestClient, baseUrl } = props;

  // 卡片列占比，默认4列
  const [colSize, setColSize] = useState(6);
  // 卡片高，默认中
  const [colHeight, setColHeight] = useState(310);
  // 看板列表数据
  const [boardList, setBoardList] = useState([]);
  const [typeTagData, setTypeTagData] = useState({
    typeList: [],
    indeterminate: false,
    checkAll: true,
  });
  // 标签选择
  const [typeSelect, setTypeSelect] = useState({
    selectedTypes: [], // 最后选择的标签
    indexSelected: [], // 显示的checkgroup的标签选择
    hideSelected: [], // 隐藏的checkgroup的标签选择
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
    boardName: undefined,
    tagIdList: [],
    prevTagList: [],
    prevHideTags: [],
  });
  // tag下来显示
  const [showDropdown, setShowDropdown] = useState(false);

  const boardListRef = useRef();
  const tagMoreRef = useRef();

  useOnClickOutside(tagMoreRef, () => setShowDropdown(false));

  // 对父组件暴露保存数据的接口
  useImperativeHandle(
    ref,
    () => ({
      clearTableQueryParams: () => {
        clearTableQueryParams();
      },
    }),
    []
  );

  useEffect(() => {
    requestBoardList();
    if (useTag) {
      requestTypeList();
    }
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
    const data = await fetchTypeList(requestClient, {}, token);
    const tags = data.map((tag) => {
      return {
        value: tag.id,
        label: tag.name,
      };
    });
    setTypeTagData((prevState) => ({
      ...prevState,
      typeList: tags,
    }));
    if (tags.length >= 5) {
      setTagShow(() => ({
        indexTypes: tags.slice(0, 4),
        otherTypes: tags.slice(4),
      }));
      setTypeSelect(() => ({
        selectedTypes: tags.map((item) => item.value),
        indexSelected: tags.slice(0, 4).map((item) => item.value),
        hideSelected: tags.slice(4).map((item) => item.value),
      }));
    } else {
      setTagShow((prevState) => ({
        ...prevState,
        indexTypes: tags.slice(0, 4),
      }));
      setTypeSelect(() => ({
        selectedTypes: tags.map((item) => item.value),
        indexSelected: tags.slice(0, 4).map((item) => item.value),
        hideSelected: [],
      }));
    }

    setSearchInfo((prevState) => ({
      ...prevState,
      tagIdList: tags.map((item) => item.value),
      prevTagList: tags.map((item) => item.value),
    }));
  };

  // 清楚localstorage存储的表格查询参数
  const clearTableQueryParams = () => {
    localStorage.removeItem(BOARD_QUERY_PARAMS_KEY);
  };

  // 配置面板
  const handleConfigBoard = (item) => {
    if (item.updateAuth === 2 && userInfo.id !== item.createUserId) {
      // 禁止他人编辑  不是本人
      biciNotification.error({
        message: "无权编辑该看板!",
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
    setCreateVisible(() => false);
  }, [setCreateVisible]);

  // 改变看板布局
  const handleSizeChange = (e) => {
    if (Number(e.target.value) === 4) {
      setColHeight(() => 210);
      setPagination((prevState) => ({
        ...prevState,
        pageSize: 30,
      }));
    }

    if (Number(e.target.value) === 8) {
      setColHeight(() => 410);
      setPagination((prevState) => ({
        ...prevState,
        pageSize: 9,
      }));
    }

    if (Number(e.target.value) === 6) {
      setColHeight(() => 310);
      setPagination((prevState) => ({
        ...prevState,
        pageSize: 12,
      }));
    }

    setColSize(Number(e.target.value));
  };
  // 展示的类型选择
  const onTypeChange = (checkedList) => {
    const newSeletedList = [...typeSelect.hideSelected, ...checkedList];
    setTypeTagData((prevState) => ({
      ...prevState,
      indeterminate: !!checkedList.length && newSeletedList.length < typeTagData.typeList.length,
      checkAll: newSeletedList.length === typeTagData.typeList.length,
    }));
    setTypeSelect((prevState) => ({
      ...prevState,
      selectedTypes: newSeletedList,
      indexSelected: checkedList,
    }));

    // 后端查询
    requestBoardList({
      name: searchInfo.boardName,
      tagIdList: newSeletedList,
    });
    setSearchInfo((prevState) => ({
      ...prevState,
      tagIdList: newSeletedList,
      prevTagList: newSeletedList,
    }));
  };
  // 隐藏类型的选择事件
  const hideTypeChange = (checkedList) => {
    const newSeletedList = [...typeSelect.indexSelected, ...checkedList];
    setTypeTagData((prevState) => ({
      ...prevState,
      indeterminate: !!checkedList.length && newSeletedList.length < typeTagData.typeList.length,
      checkAll: newSeletedList.length === typeTagData.typeList.length,
    }));
    // 后端查询
    setSearchInfo((prevState) => ({
      ...prevState,
      tagIdList: newSeletedList,
      prevHideTags: typeSelect.hideSelected,
    }));
    // 控制标签显示
    setTypeSelect((typeSelect) => ({
      ...typeSelect,
      selectedTypes: newSeletedList,
      hideSelected: checkedList,
    }));
  };
  // 选择全部标签
  const onCheckAllChange = (e) => {
    const checkedList = e.target.checked ? typeTagData.typeList.map((item) => item.value) : [];
    setTypeTagData((prevState) => ({
      ...prevState,
      indeterminate: false,
      checkAll: e.target.checked,
    }));
    setTypeSelect({
      selectedTypes: checkedList,
      indexSelected: e.target.checked ? tagShow.indexTypes.map((item) => item.value) : [],
      hideSelected: e.target.checked ? tagShow.otherTypes.map((item) => item.value) : [],
    });

    // 后端查询
    if (e.target.checked) {
      requestBoardList({
        ...pagination,
        name: searchInfo.boardName,
        tagIdList: checkedList,
      });
      setSearchInfo((prevState) => ({
        ...prevState,
        tagIdList: checkedList,
      }));
    } else {
      setBoardList([]);
      setSearchInfo((prevState) => ({
        ...prevState,
        tagIdList: [],
      }));
    }
  };

  // 处理标签选择确认
  const handleTagSeletedOk = () => {
    if (searchInfo.tagIdList.length > 0) {
      requestBoardList({
        name: searchInfo.boardName,
        tagIdList: searchInfo.tagIdList,
      });
    } else {
      setBoardList([]);
    }
    setShowDropdown(false);
    // 设置上一次查询的tag列表
    setSearchInfo((prevState) => ({
      ...prevState,
      prevTagList: searchInfo.tagIdList,
    }));
  };

  // 处理标签选择取消
  const handleTagSeletedCanel = () => {
    if (searchInfo.prevTagList.length === typeTagData.typeList.length) {
      setTypeTagData((prevState) => ({
        ...prevState,
        indeterminate: false,
        checkAll: true,
      }));
    }
    // 设置hidelist
    setShowDropdown(false);
    setTypeSelect((prevState) => ({
      ...prevState,
      selectedTypes: searchInfo.prevTagList,
      hideSelected: searchInfo.prevHideTags,
    }));
    requestBoardList({
      name: searchInfo.boardName,
      tagIdList: searchInfo.prevTagList,
    });
  };

  // 滚动加载更多
  const handleScroll = () => {
    if (
      boardListRef.current.scrollHeight - boardListRef.current.clientHeight >
      boardListRef.current.scrollTop
    ) {
      return;
    } else {
      if (boardList.length !== pagination.total) {
        const size = colSize === 4 ? 30 : colSize === 6 ? 12 : 9;
        setPagination((prevState) => ({
          ...prevState,
          pageSize: pagination.pageSize + size,
        }));
        requestBoardList({
          pagination: {
            ...pagination,
            pageSize: pagination.pageSize + size,
          },
        });
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
      token
    );
  };

  // 渲染下拉选项菜单
  const renderCheckGroup = (
    <div ref={tagMoreRef}>
      <Menu style={{ width: 440 }} selectable={false}>
        <Menu.Item>
          <Checkbox.Group
            style={{ width: "100%" }}
            value={typeSelect.selectedTypes}
            onChange={hideTypeChange}
          >
            <Row gutter={[16, 16]}>
              {tagShow.otherTypes.map((item, index) => {
                return (
                  <Col span={6} key={item.value} key={index}>
                    <Checkbox
                      value={item.value}
                      style={{
                        width: "12ch",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
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
        <Menu.Item style={{ textAlign: "right" }}>
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
    if (typeSelect.selectedTypes.length > 0) {
      requestBoardList({
        name: value,
        tagIdList: typeSelect.selectedTypes,
      });
      setSearchInfo((prevState) => ({
        ...prevState,
        boardName: value,
      }));
    }
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
                borderRight: "1px solid #C4C4C4",
              }}
            >
              <span>展示类型:</span>
              <Checkbox
                style={{ margin: "0 30px" }}
                indeterminate={typeTagData.indeterminate}
                onChange={onCheckAllChange}
                checked={typeTagData.checkAll}
              >
                全选
              </Checkbox>
            </Col>
            <Col style={{ marginLeft: 30 }}>
              <Checkbox.Group
                style={{
                  marginRight: 30,
                }}
                value={typeSelect.selectedTypes}
                onChange={onTypeChange}
              >
                <Row>
                  {tagShow.indexTypes.map((item, index) => (
                    <Checkbox
                      key={index}
                      value={item.value}
                      style={{
                        width: "12ch",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {item.label}
                    </Checkbox>
                  ))}
                </Row>
              </Checkbox.Group>
              {tagShow.otherTypes.length > 0 && (
                <Dropdown
                  overlay={renderCheckGroup}
                  trigger={["click"]}
                  visible={showDropdown}
                  placement="bottomRight"
                >
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
        <Col className={styles.operation} style={{ flex: "1 0 auto" }}>
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
      <div>
        <Row
          gutter={[16, 16]}
          style={{
            maxHeight: 820,
            overflowY: "auto",
          }}
          ref={boardListRef}
          onScroll={handleScroll}
        >
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
  }, [boardList, colHeight, colSize]);

  return (
    <ConfigProvider prefixCls="antd">
      <div
        style={{
          height: 897,
          padding: 12,
          overflow: "hidden",
        }}
        id="capture"
      >
        <div
          style={{
            height: "100%",
            background: "white",
            padding: 12,
          }}
        >
          {queryForm()}
          {!_.isEmpty(boardList) ? (
            renderBoardList
          ) : (
            <Empty style={{ marginTop: 300 }} description="暂无看板数据" />
          )}
        </div>
        {/* 新建看板 */}
        {createVisible && (
          <BoardCreate
            visible={createVisible}
            onClose={handleCreateClose}
            history={props.history}
            deptUserTree={props.deptUserTree}
            requestClient={requestClient}
            baseUrl={baseUrl}
            token={token}
            userInfo={userInfo}
            useTag={useTag}
          />
        )}
        {/* 看板管理 */}
        {manageVisible && (
          <BoardManage
            visible={manageVisible}
            onClose={handleManageClose}
            requestBoardList={requestBoardList}
            requestTypeList={requestTypeList}
            delButton={permissionBtn.delButton}
            requestClient={requestClient}
            token={token}
          />
        )}
      </div>
    </ConfigProvider>
  );
});

export default DragDropContext(HTML5Backend)(DigitalBoard);
