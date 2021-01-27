import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, ConfigProvider } from 'antd';
import BoardCreate from '../DigitalBoard/BoardCreate';
import { fetchBoardDetail, updateBoardConfigProp } from '@/apis/board';
import { getEncryption } from '@/utils/index';
import { industry_List } from '@/constant';

import preBgImg1 from '@/assets/img/pre_bgimg_1.jpg';
import preBgImg2 from '@/assets/img/pre_bgimg_2.jpg';
import preBgImg3 from '@/assets/img/pre_bgimg_3.jpg';

let isSave = false;

const DigitalCockpit = React.forwardRef((props, ref) => {
  const {
    baseUrl,
    token,
    history,
    Prompt,
    websocketConf,
    EditorLayout,
    boardId,
    requestClient,
    dataPointPropsMap,
    handleAddDataPoint,
  } = props;

  const [boardData, setBoardData] = useState({});
  const [editorData, setEditorData] = useState(undefined);
  const [extraVisible, setExtraVisible] = useState(false);
  const editorRef = useRef();

  const preInstallBgImages = [
    { key: 1, img: preBgImg1 },
    { key: 2, img: preBgImg2 },
    { key: 3, img: preBgImg3 },
  ];

  const industrialLibrary = [
    {
      name: '编组 84',
      url: require('@/assets/img/industrial/编组 84.svg'),
    },
    {
      name: '操作机',
      url: require('@/assets/img/industrial/操作机.svg'),
    },
    {
      name: '淬火池',
      url: require('@/assets/img/industrial/淬火池.svg'),
    },
    {
      name: '电炉',
      url: require('@/assets/img/industrial/电炉.svg'),
    },
    {
      name: '电渣炉',
      url: require('@/assets/img/industrial/电渣炉.svg'),
    },
    {
      name: '锻压机',
      url: require('@/assets/img/industrial/锻压机.svg'),
    },
    {
      name: '钢包',
      url: require('@/assets/img/industrial/钢包.svg'),
    },
    {
      name: '轨道衡',
      url: require('@/assets/img/industrial/轨道衡.svg'),
    },
    {
      name: '环形加热炉',
      url: require('@/assets/img/industrial/环形加热炉.svg'),
    },
    {
      name: '回转台',
      url: require('@/assets/img/industrial/回转台.svg'),
    },
    {
      name: '精炼炉',
      url: require('@/assets/img/industrial/精炼炉.svg'),
    },
    {
      name: '矩形加热炉',
      url: require('@/assets/img/industrial/矩形加热炉.svg'),
    },
    {
      name: '连铸机',
      url: require('@/assets/img/industrial/连铸机.svg'),
    },
    {
      name: '料仓',
      url: require('@/assets/img/industrial/料仓.svg'),
    },
    {
      name: '台车炉',
      url: require('@/assets/img/industrial/台车炉.svg'),
    },
    {
      name: '轧机',
      url: require('@/assets/img/industrial/轧机.svg'),
    },
    {
      name: '转炉',
      url: require('@/assets/img/industrial/转炉.svg'),
    },
    {
      name: 'AOD',
      url: require('@/assets/img/industrial/AOD.svg'),
    },
    {
      name: 'LF',
      url: require('@/assets/img/industrial/LF.svg'),
    },
    {
      name: 'RH',
      url: require('@/assets/img/industrial/RH.svg'),
    },
  ];


  const uploadConfig = {
    baseURL: baseUrl,
    self: {
      baseURL: baseUrl,
      token: token,
      url: '/api/file/file/uploadReturnPath',
      apiUrl: {
        list: '/applications/custom/component/componentList',
        delete: '/file/file/delete',
        update: '/file/file/updateFile',
      },
      data: {
        mappingId: boardData.companyId,
        mappingType: '106',
      },
    },
    preInstall: {
      baseURL: baseUrl,
      token: token,
      url: '/api/file/file/uploadReturnPath',
      data: {
        mappingId: boardData.companyId,
        mappingType: '107',
      },
    },
    combineCom: {
      apiURL: baseUrl,
      token: token,
      list: {
        url: '/applications/customComponent/list',
        params: {},
      },
      add: {
        url: '/applications/customComponent/save',
        params: {},
      },
      delete: {
        url: '/applications/customComponent/delete',
        params: {},
      },
      rename: {
        url: '/applications/customComponent/update',
        params: {},
      },
    },
    industry: {
      baseURL: baseUrl,
      mappingId: boardData.companyId,
      token: token,
      list: {
        url: '/applications/custom/component/industryList',
      },
      projectIndustryCats: industry_List,
    },
  };

  const getBoardDetail = useCallback(async (isUpdateEdit) => {
    const id = boardId;
    const data = await fetchBoardDetail(requestClient, { id }, token);
    if (data) {
      setBoardData(data);
    }
    if (isUpdateEdit && data.property) {
      const getEditorData = JSON.parse(data.property);
      setEditorData(getEditorData);
    }
  }, []);

  useEffect(() => {
    // 获取面板数据
    getBoardDetail(true);
  }, [getBoardDetail]);

  // 保存数据到数据库
  const handleSaveEditorData = (data) => {
    updateBoardConfigProp(
      requestClient,
      {
        id: boardId,
        property: JSON.stringify(data),
      },
      token,
    ).then((res) => {});
    // screenshot  缩略图文件
    if (boardData.thumbnailType === 0 && data.screenshot) {
      // 在上传新的图片
      //   const formData = new FormData();
      //   formData.append('file', data.screenshot);
      //   formData.append('mappingId', props.match.params.id);
      //   formData.append('mappingType', '105');
      //   saveOrUpdateFile(formData).then(r => {});
    }
  };

  const handlePoweroff = (location) => {
    if (!isSave && !editorRef.current?.getIsSave()) {
      confirmAgainModal(location);
      return false;
    }
    return true;
  };

  const confirmAgainModal = (location) => {
    if (!editorRef.current?.getIsSave()) {
      Modal.confirm({
        title: '当前界面有未保存的内容，是否确认退出？',
        okText: '确认退出',
        cancelText: '返回编辑',
        getContainer: () => document.querySelector('#editLayout'),
        onOk: () => {
          isSave = true;
          Modal.destroyAll();
          location?.pathname ? history.push(`${location.pathname}`) : history.push(`/newBoard`);
        },
        onCancel: () => Modal.destroyAll(),
      });
    } else {
      location?.pathname ? history.push(`${location.pathname}`) : history.push(`/newBoard`);
    }
  };

  const handlePreview = () => {
    window.open(
      `/newCockpit/${getEncryption(
        JSON.stringify({
          isShare: false,
          id: boardId,
        }),
      )}`,
      '_blank',
    );
    // props.history.push(`/newCockpit/${getEncryption(JSON.stringify({ isShare: false, id: props.match.params.id }))}`);
  };

  const handleExtraSetting = () => {
    setExtraVisible(true);
  };

  const handleExtraCancel = () => {
    setExtraVisible(false);
  };

  const handleDataPointBind = (selectedselectedRowKeys, selectedselectedRows) => {
    // @ts-ignore
    editorRef?.current.handleDataPointBind(selectedselectedRowKeys, selectedselectedRows);
  };

  useEffect(() => {
    // @ts-ignore
    ref.current.handleDataPointBind = handleDataPointBind;
  }, []);

  return (
    <div ref={ref}>
      <ConfigProvider prefixCls="antd-bici-cockpit">
        {EditorLayout && (
          <EditorLayout
            history={props.history}
            ref={editorRef}
            onEditorSaveCb={handleSaveEditorData}
            editorData={editorData}
            boardData={boardData}
            onExtraSetting={handleExtraSetting}
            // selfIndustrialLibrary={selfIndustrialLibrary}
            industrialLibrary={industrialLibrary}
            uploadConfig={uploadConfig}
            onPoweroff={confirmAgainModal}
            preInstallBgImages={preInstallBgImages}
            autoSaveInterval={5}
            websocketConf={websocketConf}
            apiURL={baseUrl}
            token={token}
            onPreview={handlePreview}
            onAddDataPoint={handleAddDataPoint}
            dataPointPropsMap={dataPointPropsMap}
          />
        )}
        {extraVisible && (
          <BoardCreate
            visible={extraVisible}
            data={boardData}
            onClose={handleExtraCancel}
            getBoardDetail={getBoardDetail}
            {...props}
          />
        )}
        {Prompt && <Prompt message={handlePoweroff} />}
      </ConfigProvider>
    </div>
  );
});

export default DigitalCockpit;
