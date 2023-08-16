import { events } from "./events";

// 左侧菜单内展示组件的拖拽功能
export function useMenuDragger(containerRef, data) {
  let currentComponent = null;
  const dragenter = (e) => {
    e.dataTransfer.dropEffect = "move"; //h5拖动时的默认图标
  };
  const dragover = (e) => {
    e.preventDefault();
  };
  const dragleave = (e) => {
    e.dataTransfer.dropEffect = "none";
  };
  const drop = (e) => {
    let blocks = data.value.blocks;
    data.value = {
      ...data.value,
      blocks: [
        ...blocks,
        {
          top: e.offsetY,
          left: e.offsetX,
          zIndex: 1,
          key: currentComponent.key,
          alignCenter: true, //第一次拖动生成后，组件中心在鼠标上
        },
      ],
    };
    currentComponent = null;
  };
  const dragstart = (e, component) => {
    // dragenter 进入元素 增加一个移动标识
    // dragover 元素经过 阻止默认行为
    // dragleave 离开元素 增加一个禁用标识
    // drop 松手时 根据拖拽的元素 增加一个组件
    containerRef.value.addEventListener("dragenter", dragenter);
    containerRef.value.addEventListener("dragover", dragover);
    containerRef.value.addEventListener("dragleave", dragleave);
    containerRef.value.addEventListener("drop", drop);
    currentComponent = component;
    events.emit("start");
  };
  const dragend = () => {
    containerRef.value.removeEventListener("dragenter", dragenter);
    containerRef.value.removeEventListener("dragover", dragover);
    containerRef.value.removeEventListener("dragleave", dragleave);
    containerRef.value.removeEventListener("drop", drop);
    events.emit("end");
  };

  return {
    dragstart,
    dragend,
  };
}
