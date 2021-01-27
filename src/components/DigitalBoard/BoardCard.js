import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { biciNotification } from 'bici-transformers';
import { getEncryption } from '@/utils/index';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { DragSource, DropTarget } from 'react-dnd';

import coverImg1 from '@/assets/img/board-1.jpg';
import coverImg2 from '@/assets/img/board-2.jpg';
import coverImg3 from '@/assets/img/board-3.jpg';
import coverImg4 from '@/assets/img/board-4.jpg';

import configIcon from '@/assets/img/board-config.svg';
import copyIcon from '@/assets/img/board-copy.svg';
import infoIcon from '@/assets/img/board-info.svg';

import styles from './index.module.css';

const coverImgObj = {
  1: coverImg1,
  2: coverImg2,
  3: coverImg3,
  4: coverImg4,
};

// 设定DragSource的拖拽事件
const CardSource = {
  // 拖动开始时，返回描述 source 数据。后续通过 monitor.getItem() 获得
  beginDrag(props) {
    return {
      id: props.id,
      originalIndex: props.findCard(props.id).index,
    };
  },
};

const CardTarget = {
  drop(props, monitor) {
    const { id: draggedId } = monitor.getItem();
    const { id: overId } = props;
    // 如果 source item 与 target item 不同，则交换位置并重新排序
    if (draggedId !== overId) {
      const { index: overIndex } = props.findCard(overId);
      props.handleMove(draggedId, overIndex);
    }
  },
};

const dragCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(), // 用于包装需要拖动的组件
  isDragging: monitor.isDragging(), // 用于判断是否处于拖动状态
});

const dropCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(), // 用于包装需接收拖拽的组件
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
});

const BoardCard = (props) => {
  const {
    isDragging,
    isOverCurrent,
    isOver,
    connectDragSource,
    connectDropTarget,
    item,
    colSize,
    configButton,
    useTag,
  } = props;

  const opacity = isDragging ? 0 : 1;

  // 字体大小
  const [titleSize, setTitleSize] = useState(32);
  // 背景图片路径
  const [src, setSrc] = useState('');

  // 处理背景图片路径
  const handleSrc = useCallback(() => {
    if (item.cover === 2 && item.url) {
      setSrc(item.url);
    } else {
      if (item.thumbnailType === 0) {
        setSrc(() => item.url);
      } else if (item.thumbnailType) {
        const src = coverImgObj[item.thumbnailType];
        setSrc(src);
      }
    }
  }, [item]);

  // 处理编号问题
  const handleCode = () => {
    if (colSize === 4) {
      // 小
      if (item.code.length > 10) {
        return item.code.substr(0, 5) + '...';
      }
    }
    return item.code;
  };
  // 处理标题大小
  const handleTitle = useCallback(() => {
    if (item.name.length > 10) {
      switch (colSize) {
        case 8:
          setTitleSize(() => 24);
          break;
        case 6:
          setTitleSize(() => 18);
          break;
        case 4:
          setTitleSize(() => 14);
          break;
      }
    } else {
      switch (colSize) {
        case 8:
          setTitleSize(() => 42);
          break;
        case 6:
          setTitleSize(() => 32);
          break;
        case 4:
          setTitleSize(() => 18);
          break;
      }
    }
  }, [colSize, item.name.length]);

  useEffect(() => {
    handleTitle();
    handleSrc();
  }, [handleSrc, handleTitle]);

  // 处理链接，加密
  const handleLinks = () => {
    return getEncryption(JSON.stringify({ isShare: false, id: item.id }));
  };

  // 模拟Link标签，跳转
  const handleCardLink = (e) => {
    const w = window.open('about:blank');
    w.location.href = window.location.origin + `/newCockpit/${handleLinks()}`;
  };

  // 简介tip
  const tipContent = (
    <div className={styles.tipContent} onClick={(e) => e.stopPropagation()}>
      <div style={{ marginBottom: 12 }}>
        <span>卡片简介</span>
        <CopyToClipboard
          text={`${window.location.origin}/newCockpit/${handleLinks()}`}
          onCopy={() => biciNotification.success({ message: '复制成功' })}
        >
          <span style={{ color: '#096DD9', float: 'right', cursor: 'pointer' }}>
            <LinkOutlined style={{ marginRight: 4 }} />
            <span>复制链接</span>
          </span>
        </CopyToClipboard>
      </div>
      <p>{item.remark}</p>
    </div>
  );
  //
  return connectDragSource(
    connectDropTarget(
      <div
        className={styles.board}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          opacity: opacity,
          cursor: 'pointer',
          border: isOverCurrent || isOver ? '2px solid #00FFC6' : 'none',
        }}
        onClick={handleCardLink}
      >
        <div className={styles.boardHead}>
          <div style={{ float: 'left', cursor: 'pointer', marginLeft: 12 }} onClick={(e) => e.stopPropagation()}>
            <span id="codeNo">No.{handleCode()}</span>
            <CopyToClipboard text={item.code} onCopy={() => biciNotification.success({ message: '复制成功' })}>
              <img src={copyIcon} className="ml4" />
            </CopyToClipboard>
          </div>
          {configButton && (
            <div
              style={{ float: 'right', cursor: 'pointer', marginRight: 12 }}
              onClick={(e) => {
                e.stopPropagation();
                props.handleConfigBoard(item);
              }}
            >
              <img src={configIcon} style={{ marginRight: 4 }} />
              配置看板
            </div>
          )}
        </div>
        <div className={styles.boardTitle}>
          {useTag ? (
            <h1 className={styles.boardTitleContent} style={{ fontSize: titleSize }}>
              {item.name}
            </h1>
          ) : (
            <h1 style={{ marginTop: '10%', color: '#fff', fontSize: titleSize }}>{item.name}</h1>
          )}

          {useTag && (
            <Tooltip placement="topLeft" title={item.typeName}>
              <p
                style={{
                  opacity: 0.7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.typeName}
              </p>
            </Tooltip>
          )}
        </div>
        <Tooltip title={tipContent} color="#ffffff" className={styles.tipWrapper}>
          <img src={infoIcon} style={{ marginRight: 4 }} />
        </Tooltip>
      </div>,
    ),
  );
};
export default DragSource(
  'boardCard',
  CardSource,
  dragCollect,
)(DropTarget('boardCard', CardTarget, dropCollect)(BoardCard));
