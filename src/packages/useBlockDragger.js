import { reactive } from "vue";

// 展示区域元素选中后拖拽功能
export function useBlockDragger(focusData, lastSelectBlock, data) {
  let dragState = {
    startX: 0,
    startY: 0,
  };
  let markLine = reactive({
    x: null,
    y: null,
  });

  const mousemove = (e) => {
    let { clientX: moveX, clientY: moveY } = e;

    // 计算当前拖拽元素的位置与显示辅助线的情况
    let left = moveX * 1 - dragState.startX * 1 + dragState.startLeft * 1;
    let top = moveY * 1 - dragState.startY * 1 + dragState.startTop * 1;

    // 两元素直接距离小于5显示辅助线
    let y = null;
    let x = null;
    for (let i = 0; i < dragState.lines.y.length; i++) {
      const { top: t, showTop: s } = dragState.lines.y[i];
      if (Math.abs(t - top) < 5) {
        y = s;
        moveY = dragState.startY * 1 - dragState.startTop * 1 + t * 1; //吸附至辅助线上
        break;
      }
    }

    for (let i = 0; i < dragState.lines.x.length; i++) {
      const { left: l, showLeft: s } = dragState.lines.x[i];
      if (Math.abs(l - left) < 5) {
        x = s;
        moveX = dragState.startX * 1 - dragState.startLeft * 1 + l * 1; //吸附至辅助线上
        break;
      }
    }
    markLine.y = y;
    markLine.x = x;

    let durX = moveX - dragState.startX;
    let durY = moveY - dragState.startY;
    focusData.value.focus.forEach((block, idx) => {
      block.top = dragState.startPos[idx].top * 1 + durY * 1;
      block.left = dragState.startPos[idx].left * 1 + durX * 1;
    });
  };
  const mouseup = (e) => {
    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
    markLine.x = null;
    markLine.y = null;
  };
  const mousedown = (e) => {
    const { width: BWidth, height: BHeight } = lastSelectBlock.value;

    dragState = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
      startLeft: lastSelectBlock.value.left, //B被拖拽前的位置
      startTop: lastSelectBlock.value.top, //B被拖拽前的位置
      lines: (() => {
        const { unfocused } = focusData.value;

        let lines = { x: [], y: [] }; //计算两根辅助线的位置,横向的线用y，纵向用x
        [
          ...unfocused,
          {
            top: 0,
            left: 0,
            width: data.value.container.width,
            height: data.value.container.height,
          },
        ].forEach((block) => {
          const { top: ATop, left: ALeft, width: AWidth, height: AHeight } = block;

          // A元素与B元素的位置关系（B为当前鼠标拖动的元素）
          lines.y.push({ showTop: ATop, top: ATop }); //顶对顶
          lines.y.push({ showTop: ATop, top: ATop - BHeight }); //顶对底
          lines.y.push({ showTop: ATop + AHeight / 2, top: ATop + AHeight / 2 - BHeight / 2 }); //中对中
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight }); //底对顶
          lines.y.push({ showTop: ATop + AHeight, top: ATop + AHeight - BHeight }); //底对底

          lines.x.push({ showLeft: ALeft, left: ALeft }); //左对左
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth }); //右对左
          lines.x.push({ showLeft: ALeft + AWidth / 2, left: ALeft + AWidth / 2 - BWidth / 2 }); //中对中
          lines.x.push({ showLeft: ALeft + AWidth, left: ALeft + AWidth - BWidth }); //右对右
          lines.x.push({ showLeft: ALeft, left: ALeft - BWidth }); //左对右
        });
        return lines;
      })(),
    };
    document.addEventListener("mousemove", mousemove);
    document.addEventListener("mouseup", mouseup);
  };

  return {
    mousedown,
    markLine,
  };
}
