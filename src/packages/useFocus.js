// 展示区元素选中功能
import { computed, ref } from "vue";

export function useFocus(data, previewRef, callback) {
  const selectIndex = ref(-1);

  const focusData = computed(() => {
    let focus = [];
    let unfocused = [];
    data.value.blocks.forEach((block) => (block.focus ? focus : unfocused).push(block));
    return { focus, unfocused };
  });

  const blockMousedown = (e, block, index) => {
    if (previewRef.value) return;

    e.preventDefault();
    e.stopPropagation(); //阻止捕获和冒泡阶段中当前事件的进一步传播

    if (e.shiftKey) {
      if (focusData.value.focus.length <= 0) {
        block.focus = true;
      } else {
        block.focus = !block.focus;
      }
    } else {
      // 聚焦某个元素（选中）
      if (!block.focus) {
        clearBlockFocus(); //清空其他人的focus
        block.focus = true;
      }
    }
    selectIndex.value = index;
    callback(e);
  };

  const lastSelectBlock = computed(() => data.value.blocks[selectIndex.value]); //最后选中的元素

  const clearBlockFocus = () => {
    data.value.blocks.forEach((block) => (block.focus = false));
  };
  const containerMousedown = () => {
    if (previewRef.value) return;

    clearBlockFocus();
    selectIndex.value = -1;
  };

  return { focusData, blockMousedown, containerMousedown, lastSelectBlock, clearBlockFocus };
}
