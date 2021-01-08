import React from 'react';
import PropTypes from 'prop-types';

class DragController extends React.Component {
  constructor(props) {
    super(props);
    this.position = {
      startX: 0,
      startY: 0,
      dx: 0,
      dy: 0,
      tx: 0,
      ty: 0,
    };
  }

  start = (event) => {
    if (event.button !== 0) return;
    document.addEventListener('mousemove', this.docMove);
    this.position.startX = event.pageX - this.position.dx;
    this.position.startY = event.pageY - this.position.dy;
  };

  docMove = (event) => {
    const { updateTransform } = this.props;
    const x = event.pageX - this.position.startX;
    const y = event.pageY - this.position.startY;
    const transformStr = `translate(${x}px,${y}px)`;
    updateTransform(transformStr, x, y, this.dom);
    this.position.dx = x;
    this.position.dy = y;
  };

  docMouseUp = () => document.removeEventListener('mousemove', this.docMove);

  componentDidMount() {
    this.dom.addEventListener('mousedown', this.start);
    document.addEventListener('mouseup', this.docMouseUp);
  }

  componentWillUnmount() {
    this.dom.removeEventListener('mousedown', this.start);
    document.removeEventListener('mouseup', this.docMouseUp);
    document.removeEventListener('mousemove', this.docMove);
  }

  render() {
    const { children } = this.props;
    const newStyle = { ...children.props.style, cursor: 'move', userSelect: 'none' };
    return React.cloneElement(React.Children.only(children), {
      /* eslint-disable no-return-assign */
      ref: (dom) => (this.dom = dom),
      style: newStyle,
    });
  }
}

DragController.defaultProps = {
  updateTransform: (transformStr, x, y, dom) => {
    /* eslint-disable no-param-reassign */
    dom.style.transform = transformStr;
  },
};

DragController.propTypes = {
  children: PropTypes.element.isRequired,
};

export default DragController;
