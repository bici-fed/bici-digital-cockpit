/**
 * @File: 可拖拽的模态框
 */
import React from 'react';
import { Modal } from 'antd';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import DragController from './DragController';

class DraggableTitle extends React.Component {
  updateTransform = (transformStr) => {
    this.modalDom.style.transform = transformStr;
  };

  componentDidMount = () => {
    const { wrapClassName } = this.props;
    const dom = document.getElementsByClassName(wrapClassName)[0];
    this.modalDom = dom;
  };

  render() {
    const { title } = this.props;
    return (
      <DragController updateTransform={this.updateTransform}>
        <div>{title}</div>
      </DragController>
    );
  }
}

class BiciDraggableModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.wrapClassName = uuidv4();
  }

  render() {
    const { title, children, visible, wrapClassName, afterClose } = this.props;
    const omitProps = _.omit(this.props, ['title', 'destroyOnClose', 'afterClose', 'wrapClassName']);
    const prefixCls = `${this.wrapClassName} ${wrapClassName}`;
    return (
      <Modal
        title={visible && <DraggableTitle wrapClassName={this.wrapClassName} title={title} />}
        wrapClassName={prefixCls}
        afterClose={() => {
          try {
            document.getElementsByClassName(this.wrapClassName)[0].style.transform = 'translate(0px, 0px)';
            if (afterClose) afterClose();
          } catch (e) {
            if (afterClose) afterClose(e);
          }
        }}
        {...omitProps}
      >
        {children}
      </Modal>
    );
  }
}

export default BiciDraggableModal;
