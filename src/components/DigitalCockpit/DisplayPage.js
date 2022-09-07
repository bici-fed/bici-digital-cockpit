import React, { useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { Row, Col, Modal, Input, Form, Checkbox, Button, InputNumber, ConfigProvider } from 'antd';
import { CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import { biciNotification } from 'bici-transformer';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  getEncryption,
  getDecryption,
  launchFullscreen,
  exitFullscreen,
  addFullScreenChanegListener,
  getFullScreenState,
} from '@/utils/index';
import { IconFont } from '@/utils/iconConfig';
import { createShareLink, hasSharePwd, checkSharePwdAndGetData, fetchBoardDetail } from '@/apis/board';
import { BOARD_SHARE_INFO } from '@/constant';

const NEW_FULL_SCREEN_ID = 'new_cockpit_full_screen';

const DisplayPage = (props) => {
  const {
    token,
    shareBtnPermission,
    Preview,
    wsUrl,
    logout,
    encodeUrl,
    requestClient,
    wrapperStyle,
    isApp,
    routePrefix = '', // 路由前缀
  } = props;

  const [form] = Form.useForm();

  const [editorData, setEditorData] = useState({});
  // 看板数据
  const [data, setData] = useState({});
  // 是否全屏
  const [isFullScreen, setIsFullScreen] = useState(getFullScreenState());
  // 是否显示
  const [headShow, setHeadShow] = useState(false);
  // 分享特殊token
  const [specialToken, setSpecialToken] = useState('');
  // websocketToken
  const [socketToken, setSocketToken] = useState(undefined);
  // 分享密码
  const [sharePwd, setSharePwd] = useState('');
  // 看板id
  const [id, setId] = useState();
  // 分享链接
  const [shareText, setShareText] = useState();
  // 过期时间
  const [validDate, setValidDate] = useState();
  // 控制modal显示
  const [visiable, setVisiable] = useState({
    needPwd: false, // 是否有密码Modal显示
    shareForm: false, // 共享Modal显示
    shareVisiable: shareBtnPermission, // 分享按钮显示
  });
  // 禁止设置
  const [disabled, setDisabled] = useState({
    pwdInput: true,
    validityInput: true,
    shareBtn: true,
  });

  const websocketConf = {
    url: `${wsUrl}?token=${socketToken}`,
  };

  // 日期处理
  const handleValidDay = useCallback(() => {
    const days = form.getFieldValue('validDay');
    let validDate = new Date();
    if (days) {
      validDate.setDate(validDate.getDate() + Number(days));
    } else {
      validDate.setDate(validDate.getDate() + 30);
    }
    setValidDate(validDate.toLocaleDateString());
    form.setFieldsValue({ shareLink: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setValidDate]);

  useEffect(() => {
    if (token) {
      setSocketToken(token);
    }
    // 全屏监听器
    addFullScreenChanegListener(() => {
      const visible = getFullScreenState();
      setIsFullScreen(visible);
    });
  }, [token]);

  useEffect(() => {
    if (encodeUrl) {
      const { id, isShare, token: tokenTmp } = JSON.parse(getDecryption(encodeUrl));
      setId(id);
      setSpecialToken(tokenTmp);
      if (isShare && tokenTmp) {
        // 分享链接
        getSharedData(id, tokenTmp);
      } else {
        // 正常查看链接
        getNoSharedData(id);
      }
    }
  }, [encodeUrl]);

  useEffect(() => {
    handleValidDay();
  }, [handleValidDay]);

  // 分享获取详情
  const getSharedData = async (id, tokenTmp) => {
    setSocketToken(tokenTmp);
    setVisiable({
      ...visiable,
      shareVisiable: false,
    });
    const res = await hasSharePwd(requestClient, tokenTmp);

    const shareBoardInfoList = JSON.parse(localStorage.getItem(BOARD_SHARE_INFO) || '[]');
    const hasVerifiedEncodeUrl = shareBoardInfoList.filter((item) => item.key === encodeUrl).length > 0;

    if (res && !hasVerifiedEncodeUrl) {
      // 分享 需要密码认证
      setVisiable({
        ...visiable,
        needPwd: true,
      });
    } else {
      let data = undefined;
      if (!res) {
        // 分享的不需要密码
        // 获取看板详情
        data = await checkSharePwdAndGetData(requestClient, tokenTmp);
      } else {
        // 分享  已经认证过
        const pwd = window.atob(shareBoardInfoList.filter((item) => item.key === encodeUrl)[0].pwd);
        data = await checkSharePwdAndGetData(requestClient, tokenTmp, pwd);
      }

      if (data) {
        setData(data);
        if (data.property) {
          const getEditorData = JSON.parse(data.property);
          setEditorData(getEditorData);
        } else {
          biciNotification.warning({
            message: '未配置看板！',
          });
        }
      }
    }
  };

  const getNoSharedData = async (id) => {
    // 不是分享的
    // 获取看板详情
    try {
      const data = await fetchBoardDetail(requestClient, { id }, token);
      // 同一个companyId下的用户才能看
      if (data) {
        setData(data);
        if (data.property) {
          const getEditorData = JSON.parse(data.property);
          setEditorData(getEditorData);
        } else {
          biciNotification.warning({
            message: '请配置看板！',
          });
        }
      }
    } catch (error) {
      // 不是同一companyId跳转到login
      // 跳转到登录
      logout && logout(error);
    }
  };

  // 获取分享的看板数据
  const getSharedBoardData = async (token, sharePwd) => {
    const data = await checkSharePwdAndGetData(requestClient, token, sharePwd);

    if (data) {
      const shareInfo = JSON.parse(localStorage.getItem(BOARD_SHARE_INFO) || '[]');
      shareInfo.push({ key: encodeUrl, pwd: window.btoa(sharePwd) });
      localStorage.setItem(BOARD_SHARE_INFO, JSON.stringify(shareInfo));
      // 认证成功
      setData(data);
      if (data.property) {
        const getEditorData = JSON.parse(data.property);
        setEditorData(getEditorData);
      }
      setVisiable({ ...visiable, shareVisiable: false, needPwd: false });
    }
  };

  // 重置分享Modal
  const restShareModal = () => {
    form.resetFields();
    setDisabled({
      pwdInput: true,
      validityInput: true,
      shareBtn: true,
    });
    handleValidDay();
  };
  // 分享Modal取消处理
  const handleCancelShareModal = () => {
    setVisiable({ ...visiable, shareForm: false });
    restShareModal();
  };

  // 生成链接
  const generateLink = (e) => {
    e.preventDefault();
    const values = form.getFieldsValue(['password', 'validDay']);
    const distParams = {
      newCockpitBoardId: id,
      ...values,
    };
    createShareLink(requestClient, distParams, token).then((res) => {
      // 生成链接
      const code = getEncryption(
        JSON.stringify({
          isShare: true,
          id,
          token: res.uuid,
        }),
      );
      const link = `${window.location.origin}${routePrefix}/newCockpit/${code}`;
      // const link = `http://localhost:5000/cockpit/${code}`
      form.setFieldsValue({ shareLink: link });
      const shareStr = values.password
        ? `${data.companyName}邀您共享数据看板，请用浏览器访问：${link} ，输入访问密码：【${values.password}】，有效期至${validDate}`
        : `${data.companyName}邀您共享数据看板，请用浏览器访问：${link} ，有效期至${validDate}`;
      setShareText(() => shareStr);
      setDisabled((prevState) => ({
        ...prevState,
        shareBtn: false,
      }));
    });
  };

  // 复制编号
  const handlerCopyCode = (text) => {
    if (isFullScreen) {
      let tmpNode = document.createElement('textarea');
      document.body.appendChild(tmpNode);
      tmpNode.value = text;
      tmpNode.select();
      document.execCommand('copy');
      document.body.removeChild(tmpNode);

      // navigator.clipboard.writeText(text).then(() => {})
    }
    biciNotification.success({
      message: '复制成功',
    });
  };
  // 复制链接密码
  const copyShareLink = (text) => {
    if (isFullScreen) {
      // Create an input field with the minimum size and place in a not visible part of the screen
      let tempTextAreaField = document.createElement('textarea');
      tempTextAreaField.style = 'position:fixed;top:-5rem;height:1px;width:10px;';

      // Assign the content we want to copy to the clipboard to the temporary text area field
      tempTextAreaField.value = text;

      // Append it to the body of the page
      document.getElementById('cockpitContent').appendChild(tempTextAreaField);

      // Select the content of the temporary markup field
      tempTextAreaField.select();

      // Run the copy function to put the content to the clipboard
      document.execCommand('copy');

      // Remove the temporary element from the DOM as it is no longer needed
      tempTextAreaField.remove();

      // navigator.clipboard.writeText(text).then(() => {})
    }
    biciNotification.success({
      message: '复制成功',
    });
    setVisiable((prevState) => ({
      ...prevState,
      shareForm: false,
    }));
    restShareModal();
  };
  // 处理全屏
  const handleShowFullScreen = () => {
    if (isFullScreen) {
      exitFullscreen();
    } else {
      const fullScreenElement = document.getElementById(NEW_FULL_SCREEN_ID);
      launchFullscreen(fullScreenElement);
    }
  };

  // 处理密码框勾选
  const handlePwdCheckBox = (e) => {
    if (e.target.checked) {
      const tempPwd = Math.random().toString(36).substr(2, 6);
      form.setFieldsValue({
        password: tempPwd,
        shareLink: '',
      });
    } else {
      form.resetFields(['password']);
    }
    setDisabled((prevState) => ({
      ...prevState,
      pwdInput: !e.target.checked,
    }));
  };
  // 处理有效时间勾选
  const handleValidityCheckBox = (e) => {
    if (e.target.checked) {
      form.setFieldsValue({
        validDay: 7,
        shareLink: '',
      });
      handleValidDay();
    } else {
      form.resetFields(['validDay']);
      handleValidDay();
    }
    setDisabled((prevState) => ({
      ...prevState,
      validityInput: !e.target.checked,
    }));
  };
  const limitDecimals = (value) => {
    return value.toString().replace(/^(0+)|[^\d]+/g, '');
  };

  const style = {
    width: '100vw',
    height: '100vh',
    overflow: 'auto',
    // zIndex: 1,
    // position: 'relative',
    // margin: '0 auto',
    // background: 'pink',
  };

  const headerStyle = {
    width: '100%',
    height: 48,
    lineHeight: '48px',
    position: 'absolute',
    padding: '0 12px',
    background: 'rgba(51,51,51,0.8)',
    color: '#fff',
    zIndex: 1,
    left: 0,
    top: headShow ? 0 : -48,
    transition: 'top 0.3s',
  };

  const spanStyle = {
    display: 'inline-block',
    overflow: 'hidden',
    marginLeft: 6,
    marginRight: 6,
  };

  const formLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  const renderSeePwdModal = (
    <Modal
      title="查看看板"
      centered
      getContainer={document.getElementById('cockpitContent')}
      visible={visiable.needPwd}
      mask={true}
      maskClosable={false}
      maskStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
      footer={[
        <Button key="submit" type="primary" onClick={() => getSharedBoardData(specialToken, sharePwd)}>
          确定
        </Button>,
      ]}
    >
      <Input.Password
        placeholder="请输入密码查看"
        onChange={(e) => {
          setSharePwd(e.target.value);
        }}
      />
    </Modal>
  );

  const renderShareModal = (
    <Modal
      title="看板共享"
      visible={visiable.shareForm}
      getContainer={document.getElementById('cockpitContent')}
      onCancel={handleCancelShareModal}
      footer={[
        <Button key="back" onClick={handleCancelShareModal}>
          取消
        </Button>,
        <CopyToClipboard key="copy" text={shareText} onCopy={copyShareLink}>
          <Button type="primary" disabled={disabled.shareBtn}>
            复制链接（密码）
          </Button>
        </CopyToClipboard>,
      ]}
    >
      <Form {...formLayout} name="shareForm" form={form}>
        <Form.Item label="设置密码">
          <Checkbox
            style={{ marginLeft: 10, marginRight: 16 }}
            checked={!disabled.pwdInput}
            onChange={handlePwdCheckBox}
          />
          <Form.Item name="password" noStyle>
            <Input.Password
              style={{ width: 260 }}
              disabled={disabled.pwdInput}
              placeholder="请填写密码"
              onChange={() =>
                form.setFieldsValue({
                  shareLink: '',
                })
              }
            />
          </Form.Item>
        </Form.Item>

        <Form.Item label="设置有效期">
          <Checkbox
            style={{ marginLeft: 10, marginRight: 16 }}
            checked={!disabled.validityInput}
            onChange={handleValidityCheckBox}
          />
          <Form.Item name="validDay" noStyle>
            <InputNumber
              style={{ width: 160 }}
              min={1}
              disabled={disabled.validityInput}
              placeholder="请填写有效期(天)"
              formatter={limitDecimals}
              parser={limitDecimals}
              onChange={handleValidDay}
            />
          </Form.Item>
          <span style={{ marginLeft: 16 }}>有效值至{validDate}</span>
        </Form.Item>
        <Form.Item>
          <a style={{ marginLeft: 130 }} onClick={generateLink}>
            生成链接
          </a>
        </Form.Item>
        <Form.Item label="分享链接" name="shareLink">
          <Input placeholder="请点击上方文字按钮生成链接" disabled></Input>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <ConfigProvider prefixCls="antd-bici-cockpit">
      <div
        style={{
          position: 'relative',
          background: '#EAEEF2',
          overflow: 'hidden',
          ...wrapperStyle,
        }}
        id={NEW_FULL_SCREEN_ID}
      >
        {isApp ? (
          ''
        ) : (
          <div
            style={{
              height: 48,
              position: 'absolute',
              left: 0,
              top: 0,
              zIndex: 2,
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setHeadShow(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setHeadShow(false);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={headerStyle}>
              <Row justify="space-between">
                <Col md={6} lg={4}>
                  <span style={{ marginLeft: 12 }}>No.{data.code}</span>
                  <CopyToClipboard text={data.code} onCopy={handlerCopyCode}>
                    <CopyOutlined style={{ marginLeft: 4 }} />
                  </CopyToClipboard>
                </Col>
                <Col sm={0} md={10} lg={14}>
                  <span style={spanStyle}>{data.name}</span>
                  {data.typeName && (
                    <>
                      <span style={spanStyle}>/</span>
                      <span
                        style={{
                          ...spanStyle,
                          maxWidth: '10rem',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {data.typeName}
                      </span>
                    </>
                  )}
                  <span style={spanStyle}>/</span>
                  <span
                    style={{
                      maxWidth: '10rem',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'inline-block',
                    }}
                  >
                    {data.remark}
                  </span>
                </Col>
                <Col md={8} lg={6}>
                  {visiable.shareVisiable && (
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setVisiable({
                          ...visiable,
                          shareForm: true,
                        })
                      }
                    >
                      <ShareAltOutlined />
                      <span style={{ marginLeft: 6 }} style={{ marginRight: 36 }}>
                        看板分享
                      </span>
                    </span>
                  )}
                  <span style={{ cursor: 'pointer' }} onClick={handleShowFullScreen}>
                    <IconFont type={isFullScreen ? 'shouqi1' : 'quanping'} />
                    <span style={{ marginLeft: 6 }}>{isFullScreen ? '退出全屏' : '展示全屏'}</span>
                  </span>
                </Col>
              </Row>
            </div>
          </div>
        )}
        <div style={style} id="cockpitContent">
          {Preview && editorData && socketToken && (
            <Preview data={editorData} isApp={isApp} websocketConf={websocketConf} />
          )}
        </div>
        {renderShareModal}
        {renderSeePwdModal}
      </div>
    </ConfigProvider>
  );
};

export default DisplayPage;
