import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Form, Modal, Button, Radio, Input, Upload, Select, TreeSelect } from 'antd';
import { BiciTagsManager, biciNotification } from 'bici-transformer';
import _ from 'lodash';
import { createBoard, modifyBoard } from '@/apis/board';
import { deleteTags, getTagsList, saveTags, updateTags } from '@/apis/tag';
import { fileDelete, batchFileMappingId, requestUploadDetail, downloadById } from '@/apis/file';
import BiciDraggableModal from '@/components/BiciDraggableModal';

import '@/assets/css/index.css';

import board1 from '@/assets/img/board-1.jpg';
import board2 from '@/assets/img/board-2.jpg';
import board3 from '@/assets/img/board-3.jpg';
import board4 from '@/assets/img/board-4.jpg';

const { Option } = Select;

const deviceType = 13;
const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 19 },
};

const BoardCreate = (props) => {
  const {
    visible,
    data,
    onClose,
    history,
    deptUserTree,
    userInfo,
    token,
    requestClient,
    useTag,
    baseUrl,
    draggable,
    customPermission = false,
    permissionData = [],
    setPermissionData,
    onPermissionButtonClick,
    onPermissionChange,
    onBoardCreateModalClose,
    BiciTagManager,
    routePrefix = '', // 路由前缀
  } = props;

  // 描述文本长度
  const [textLength, setTextLength] = useState({
    remarkLen: 0,
    nameLen: 0,
  });
  // 封面缩略图  缩略图 0:使用缩略图 1:默认1,2:默认2,3:默认3 4:默认4
  const [picType, setPicType] = useState(undefined);
  // 图片文件
  const [fileList, setFileList] = useState([]);
  // 所有看板类型
  const [types, setTypes] = useState([]);
  // 已选择的看板类型
  const [selectedTypes, setSelectedTypes] = useState([]);
  // 可见权限tree数据
  const [treeData, setTreeData] = useState([]);
  // antd表单hooks
  const [form] = Form.useForm();
  // 请求所有看板类型
  const requestTypes = useCallback(async () => {
    if (useTag) {
      const { tagList } = await getTagsList(requestClient, { deviceType }, token);
      const tags = tagList?.map((tag) => {
        return { id: tag.tagId, name: tag.tagName };
      });
      setTypes(tags);
      if (data) {
        // 编辑状态，回显
        const editTags = tags.filter((item) => data.tagIdList?.includes(item.id));
        setSelectedTypes(editTags);
      }
    }
  }, [data, useTag]);
  // 处理数据回显
  const handleEditData = useCallback(() => {
    if (data) {
      let coverRadio = 0;

      if (data.cover === 2) {
        if (data.thumbnailType === 0) {
          coverRadio = 1;
        } else {
          coverRadio = 2;
          // 上传图片回显
          requestUploadDetail(requestClient, { mappingType: 105, mappingId: data.id }, token).then((res) => {
            const files = res.map((item) => ({
              uid: item.id,
              name: item.name.substr(0, 45) + (item.name.length > 45 ? '...' : ''),
              status: 'done',
              url: item.url,
            }));
            setFileList(files);
          });
        }
      } else {
        setPicType(data.thumbnailType);
      }

      let formVals = {
        code: data.code,
        name: data.name,
        updateAuth: data.updateAuth,
        remark: data.remark,
        coverRadio,
      };

      if (customPermission) {
        const permissionData = (data.newCockpitVisibleConfigList || []).map((item) => ({
          id: item.userId,
          name: item.userName,
        }));
        if (setPermissionData) setPermissionData(permissionData);
        formVals.permissionData = permissionData;
      } else {
        let permissionTree = (data.newCockpitVisibleConfigList || []).map((item) => item.userId);
        // 选择树没有当前用户，不回显
        if (!_.isEmpty(treeData) && !treeData.map((item) => item.value).includes(userInfo.id)) {
          permissionTree = permissionTree.filter((id) => id !== userInfo.id);
        }

        formVals.deptUser = permissionTree;
      }
      form.setFieldsValue(formVals);
      setTextLength({ nameLen: data.name.length, remarkLen: data.remark ? data.remark.length : 0 });
    } else {
      form.resetFields();
    }
  }, [data, form, setPermissionData]);

  useEffect(() => {
    requestTypes();
    handleEditData();
  }, [handleEditData, requestTypes]);
  // 自定义权限更新同步
  useEffect(() => {
    if (deptUserTree) {
      setTreeData(deptUserTree);
    }
    if (permissionData) {
      form.setFieldsValue({ permissionData });
    }
  }, [permissionData, deptUserTree]);

  // 修改标签
  const handleEditTag = (toSetDataSource, editedId, editedName) => {
    updateTags(
      requestClient,
      {
        id: editedId,
        name: editedName,
        deviceType,
      },
      token,
    ).then(() => {
      const selectedTypesData = _.cloneDeep(selectedTypes);
      const typesData = _.cloneDeep(types);
      const index = typesData.findIndex((tag) => tag.id === editedId);
      const index2 = selectedTypesData.findIndex((tag) => tag.id === editedId);
      typesData[index].name = editedName;
      if (index2 >= 0) {
        selectedTypesData[index2].name = editedName;
        setSelectedTypes(selectedTypesData);
        setTypes(typesData);
      } else {
        setTypes(typesData);
      }
    });
  };
  // 删除标签
  const handleDeleteTag = (toSetDataSource, toDeleteId, isToDatabase) => {
    if (isToDatabase) {
      // 在备选项中删除标签
      deleteTags(requestClient, { id: toDeleteId }, token).then(() => {
        const selectedTypesData = _.cloneDeep(selectedTypes);
        const typesData = _.cloneDeep(types);
        const index = typesData.findIndex((tag) => tag.id === toDeleteId);
        const index2 = selectedTypesData.findIndex((tag) => tag.id === toDeleteId);
        typesData.splice(index, 1);
        if (index2 >= 0) {
          selectedTypesData.splice(index2, 2);
          setSelectedTypes(() => selectedTypesData);
          setTypes(typesData);
        } else {
          setTypes(typesData);
        }
      });
    } else {
      //仅去掉视图上显示
      const index = selectedTypes.findIndex((tag) => tag.id === toDeleteId);
      selectedTypes.splice(index, 1);
      setSelectedTypes(() => selectedTypes);
    }
  };
  // 创建标签
  const handleCreateTag = (newTagName) => {
    saveTags(
      requestClient,
      {
        deviceType,
        name: newTagName,
      },
      token,
    ).then((res) => {
      const selectedTypesData = _.cloneDeep(selectedTypes);
      const typesData = _.cloneDeep(types);
      let newTag = { id: res.id, name: res.name };
      typesData.push(newTag);
      selectedTypesData.push(newTag);
      setSelectedTypes(selectedTypesData);
      setTypes(typesData);
    });
  };

  // 选择标签
  const handleSelectTag = (toSetDataSource) => {
    setSelectedTypes(toSetDataSource);
  };
  // 模态框确认处理
  const handleOk = () => {
    form.validateFields().then((values) => {
      if (useTag && _.isEmpty(selectedTypes)) {
        biciNotification.error({ message: '必须选择看板类型!' });
        return;
      }
      const { id: userId, name: userName } = userInfo;
      const { name, remark, updateAuth, deptUser, permissionData, coverRadio } = values;
      let newCockpitVisibleConfigList = [];
      if (customPermission) {
        newCockpitVisibleConfigList = permissionData.map((p) => ({ userId: p.id, username: p.name }));
      } else {
        newCockpitVisibleConfigList = deptUser.map((id) => ({ userId: id }));
      }
      // 没有选择登录用户，添加
      if (!newCockpitVisibleConfigList.map((item) => item.userId).includes(userId)) {
        newCockpitVisibleConfigList.push({ userId, userName });
      }
      // cover 封面 1:预览图 2:图片
      let distParams = {
        name,
        remark,
        updateAuth,
        links: `${window.location.origin}${routePrefix}/newCockpit`,
        newCockpitVisibleConfigList,
        tagIdList: selectedTypes.map((item) => item.id),
      };
      if (picType) {
        distParams.thumbnailType = picType;
        distParams.cover = 1;
        if (picType === 0) {
          distParams.cover = 2;
        }
      } else {
        distParams.cover = 2;
      }

      if (coverRadio === 2 && fileList.length === 0) {
        distParams.thumbnailType = 1;
        distParams.cover = 1;
      }

      if (data) {
        // 更新看板方法
        distParams.id = data.id;
        modifyBoard(requestClient, distParams, token).then((res) => {
          biciNotification.success({ message: '更新成功!' });
          // 关闭模态框
          props.onClose();
          props.getBoardDetail(false);
        });
      } else {
        // 调用创建看板方法
        createBoard(requestClient, distParams, token)
          .then((res) => {
            if (fileList.length > 0) {
              // 如果上传了图片，更新图片看板id
              batchFileMappingId(
                requestClient,
                {
                  idList: [fileList[0].response.data[0]],
                  mappingType: 105,
                  mappingId: res,
                },
                token,
              )
                .then((res) => {})
                .catch((error) => {
                  biciNotification.error({ message: '图片上传失败!' });
                });
            }

            biciNotification.success({ message: '创建成功!' });
            // 关闭模态框
            props.onClose();
            // 跳转到配置页面
            window.location.href = window.location.origin + `${routePrefix}/newBoard/${res}`;
            // history.push({ pathname: `${routePrefix}/newBoard/${res}` });
          })
          .catch((err) => {
            biciNotification.error({ message: '创建失败!' });
          });
      }
    });
  };

  const coverCodeOnClick = (e, code) => {
    e.preventDefault();
    e.stopPropagation();
    if (form.getFieldValue('coverRadio') === 2 && fileList.length !== 0) {
      biciNotification.error({ message: '请先删除图片!' });
      form.setFieldsValue({ coverRadio: 2 });
      return;
    }
    form.setFieldsValue({ coverRadio: 0 });
    setPicType(code);
  };

  // 渲染看板可选的缩略图
  const renderCover = () => {
    const coverCode = [1, 2, 3, 4];
    const prefixImgStyle = { width: 94, height: 66, cursor: 'pointer' };

    return coverCode.map((code) => {
      const srcMap = { 1: board1, 2: board2, 3: board3, 4: board4 };
      const src = srcMap[code];
      const isActive = picType === code && fileList.length === 0;
      return (
        <div style={{ position: 'relative', marginRight: 8 }} key={code}>
          <img
            style={prefixImgStyle}
            alt={`board-cover-${code}`}
            src={src}
            onClick={(e) => coverCodeOnClick(e, code)}
          />
          {isActive && (
            <CheckCircleFilled style={{ position: 'absolute', top: 2, right: 2, fontSize: 16, color: '#1890ff' }} />
          )}
        </div>
      );
    });
  };
  // 上传图片前回调
  const beforeUpload = (file) => {
    const acceptFileType = `image/jpeg,image/jpg,image/png`;
    // 文件大小限制，最大为5M
    const sizeLimit = 1024 * 1024 * 5;
    const { size, name, type } = file;
    if (size > sizeLimit) {
      biciNotification.info({ message: `${name}大于5M` });
      return false;
    }
    if (!type || acceptFileType.indexOf(type) === -1) {
      biciNotification.info({ message: '不支持上传此文件格式' });
      return false;
    }

    return true;
  };
  // 处理图片radio改变
  const handleChangePic = (e) => {
    if (e.target.value !== 2 && fileList.length !== 0) {
      biciNotification.error({ message: '请先删除图片!' });
      form.setFieldsValue({ coverRadio: 2 });
      return;
    }

    if (e.target.value === 1) {
      setPicType(0);
    } else if (e.target.value === 2) {
      setPicType(undefined);
    } else if (e.target.value === 0) {
      setPicType(1);
    }
  };
  // 处理图片上传
  const handleUploadChange = ({ fileList }) => {
    setPicType(undefined);
    setFileList(fileList.filter((file) => !!file.status));
  };
  // 处理图片移除
  const handleUploadRemove = (file) => {
    if (!file.response) {
      // 回显时删除
      fileDelete(requestClient, { id: fileList[0].uid }, token).then((res) => {});
    } else {
      // 创建时删除
      fileDelete(requestClient, { id: file.response.data[0] }, token).then((res) => {});
    }
  };
  // 处理树形选择
  const handleTreeChange = (value) => {
    form.setFieldsValue({ deptUser: value });
  };

  const onPreview = async (file) => {
    if (file.response.code === 1000) {
      const src = await downloadById(requestClient, { id: file.response.data[0] }, token);
      if (src) {
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow.document.write(image.outerHTML);
      }
    }
  };

  // 渲染表单
  const renderForm = () => {
    return (
      <Form {...formItemLayout} form={form} name="boardCreateForm">
        <Form.Item label="看板编号" name="code">
          <Input disabled placeholder="新建成功后将自动生成" />
        </Form.Item>
        <Form.Item
          label="看板名称"
          name="name"
          rules={[
            { required: true, whitespace: true, message: '必填项' },
            { max: 20, message: '最多输入20位字符' },
          ]}
        >
          <Input
            placeholder="请输入看板名称"
            maxLength="20"
            suffix={`${textLength.nameLen}/20`}
            onChange={() => {
              setTextLength((prevState) => ({
                ...prevState,
                nameLen: form.getFieldValue('name').length,
              }));
            }}
          />
        </Form.Item>
        {useTag && BiciTagManager ? (
          <BiciTagManager
            isRequired
            label="看板类型:"
            labelStyle={{
              fontSize: 14,
              width: 87,
            }}
            style={{ marginBottom: 24 }}
            tagLength={10}
            selectMax={10}
            deviceType={deviceType}
            selectData={selectedTypes.map((tag) => tag.id)}
            onChange={(tagsList, tagIdList) => {
              setSelectedTypes(tagsList.map((item) => ({ id: item.tagId, name: item.tagName })));
            }}
          />
        ) : (
          <BiciTagsManager
            labelElement={
              <div
                style={{
                  fontSize: 12,
                  width: 87,
                  lineHeight: '32px',
                  textAlign: 'right',
                }}
              >
                看板类型：
              </div>
            }
            tagLength={10}
            selectMax={10}
            dataSource={selectedTypes}
            selectData={types}
            onSelectTag={handleSelectTag}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            onEditTag={handleEditTag}
          />
        )}

        {!_.isEmpty(treeData) && !customPermission && (
          <Form.Item label="可见权限" name="deptUser" rules={[{ required: true, message: '必填项!' }]}>
            <TreeSelect
              treeData={treeData}
              treeCheckable
              showSearch
              virtual={false}
              treeNodeFilterProp="title"
              showCheckedStrategy="SHOW_CHILD"
              placeholder="请在组织内选择可见范围"
              onChange={handleTreeChange}
            />
          </Form.Item>
        )}
        {/* 扩展可见权限配置，支持自定义权限渲染 */}
        {customPermission && (
          <Form.Item label="可见权限" name="permissionData" rules={[{ required: true, message: '必填项!' }]}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Select
                open={false}
                mode="multiple"
                value={permissionData.map((p) => p.id)}
                placeholder="请在组织内选择可见范围"
                style={{ width: '70%', maxWidth: 300 }}
                onChange={(ids) => {
                  const updatePermissionData = permissionData.filter((p) => ids.includes(p.id));
                  if (onPermissionChange) onPermissionChange(updatePermissionData);
                  form.setFieldsValue({ permissionData: updatePermissionData });
                }}
              >
                {permissionData.map((permission) => (
                  <Option key={permission.id} value={permission.id}>
                    {permission.name}
                  </Option>
                ))}
              </Select>
              <Button onClick={() => onPermissionButtonClick && onPermissionButtonClick(permissionData)}>
                按组织选择
              </Button>
            </div>
          </Form.Item>
        )}
        <Form.Item label="修改权限" name="updateAuth" rules={[{ required: true, message: '请选择一个' }]}>
          <Radio.Group>
            <Radio value={1}>允许他人编辑与删除</Radio>
            <Radio value={2}>禁止他人编辑与删除</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="简介">
          <Form.Item name="remark" noStyle rules={[{ max: 100, message: '最多输入100位字符' }]}>
            <Input.TextArea
              placeholder="请输入看板描述"
              maxLength="100"
              onChange={() => {
                setTextLength((prevState) => ({
                  ...prevState,
                  remarkLen: form.getFieldValue('remark').length,
                }));
              }}
            />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>{textLength.remarkLen}/100字</div>
        </Form.Item>
        <Form.Item label="看板封面" name="coverRadio" rules={[{ required: true, message: '请选择一个' }]}>
          <Radio.Group onChange={handleChangePic} style={{ paddingTop: '7px' }}>
            <Radio value={0}>
              使用默认缩略图
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 20, marginTop: 6 }}>
                {renderCover()}
              </div>
            </Radio>
            {/* <Radio value={1}>使用看板缩略图</Radio> */}
            <br />
            <Radio value={2} style={{ marginTop: 6 }}>
              上传图片
              <div style={{ marginTop: 6, marginLeft: 20 }}>
                <Upload
                  className="board-create-upload"
                  style={{ marginTop: 6 }}
                  data={{ mappingType: 105, mappingId: data ? data.id : 3 }}
                  action={`${baseUrl}/api/file/file/upload`}
                  accept="image/jpeg,image/jpg,image/png"
                  headers={{ token }}
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={onPreview}
                  onChange={handleUploadChange}
                  beforeUpload={beforeUpload}
                  onRemove={handleUploadRemove}
                >
                  {fileList.length >= 1 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传文件</div>
                    </div>
                  )}
                </Upload>
              </div>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    );
  };

  const ModalInstance = draggable ? BiciDraggableModal : Modal;

  return (
    <ModalInstance
      centered
      getContainer={data ? document.querySelector('#editLayout') : false}
      title={data ? '配置看板' : '新建看板'}
      width={580}
      visible={visible}
      onCancel={() => {
        form.resetFields();
        if (onClose) onClose();
        if (onBoardCreateModalClose) onBoardCreateModalClose();
      }}
      onOk={handleOk}
      okText="确认"
      cancelText="取消"
    >
      <div>{renderForm()}</div>
    </ModalInstance>
  );
};

export default BoardCreate;
