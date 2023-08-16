import { computed, defineComponent, inject, ref } from "vue";
import "./editor.scss";
import EditorBlock from "./editor-block";
import deepcopy from "deepcopy";

import { useMenuDragger } from "./useMenuDragger"; // 左侧菜单内展示组件的拖拽功能
import { useFocus } from "./useFocus"; // 展示区元素选中功能
import { useBlockDragger } from "./useBlockDragger"; // 左侧菜单内展示组件的拖拽功能
import { useCommand } from "./useCommand";

export default defineComponent({
  name: "Editor",
  props: {
    modelValue: {
      type: Object,
    },
  },
  emits: ["update:modelValue"], //利用v-model语法糖更新
  setup: (props, ctx) => {
    const data = computed({
      get() {
        return props.modelValue;
      },
      set(newValue) {
        ctx.emit("update:modelValue", deepcopy(newValue));
      },
    });

    const containerStyles = computed(() => ({
      width: `${data.value.container.width}px`,
      height: `${data.value.container.height}px`,
    }));

    const config = inject("config");
    const containerRef = ref(null);

    const { dragstart, dragend } = useMenuDragger(containerRef, data); //拖拽功能

    let { blockMousedown, focusData, containerMousedown, lastSelectBlock } = useFocus(data, (e) => {
      mousedown(e);
    });
    let { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data);

    const { commands } = useCommand(data);
    const button = [
      {
        label: "撤销",
        icon: "iconfont icon-chexiao",
        handler: () => commands.undo(),
      },
      {
        label: "重做",
        icon: "iconfont icon-zhongzuo",
        handler: () => commands.redo(),
      },
    ];

    return () => (
      <div class="editor">
        <div class="editor-left">
          {config.componentList.map((component) => (
            <div
              class="editor-left-item"
              draggable
              onDragstart={(e) => dragstart(e, component)}
              onDragend={dragend}
            >
              <span>{component.label}</span>
              <div>{component.preview()}</div>
            </div>
          ))}
        </div>
        <div class="editor-top">
          {button.map((btn, index) => {
            return (
              <div class="editor-top-button" onClick={btn.handler}>
                <i class={btn.icon}></i>
                <span>{btn.label}</span>
              </div>
            );
          })}
        </div>
        <div class="editor-right">属性栏</div>
        <div class="editor-container">
          {/* 负责产生滚动条 */}
          <div class="editor-container-canvas">
            {/* 负责内容区 */}
            <div
              class="editor-container-canvas_content"
              ref={containerRef}
              onMousedown={containerMousedown}
              style={containerStyles.value}
            >
              {data.value.blocks.map((block, index) => (
                <EditorBlock
                  class={block.focus ? "editor-block-focus" : ""}
                  block={block}
                  onMousedown={(e) => blockMousedown(e, block, index)}
                >
                  {block.focus}
                </EditorBlock>
              ))}
              {markLine.x !== null && <div class="line-x" style={{ left: `${markLine.x}px` }}></div>}
              {markLine.y !== null && <div class="line-y" style={{ top: `${markLine.y}px` }}></div>}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
