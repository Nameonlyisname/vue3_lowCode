import { computed, defineComponent, inject, ref } from "vue";
import EditorBlock from "./editor-block";
import deepcopy from "deepcopy";
import { useMenuDragger } from "./useMenuDragger"; // 左侧菜单内展示组件的拖拽功能
import { useFocus } from "./useFocus"; // 展示区元素选中功能
import { useBlockDragger } from "./useBlockDragger"; // 左侧菜单内展示组件的拖拽功能
import { useCommand } from "./useCommand";
import { $dialog } from "../component/Dialog";
import { ElButton } from "element-plus";
import { $dropdown, DropdownItem } from "../component/Dropdown";
import EditorOperator from "./editor-operator";

import "./editor.scss"; //样式覆盖问题 扔最底下

export default defineComponent({
  name: "Editor",
  props: {
    modelValue: {
      type: Object,
    },
    formData: Object,
  },
  emits: ["update:modelValue"], //利用v-model语法糖更新
  setup: (props, ctx) => {
    const previewRef = ref(false);
    const editorRef = ref(true);

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

    let { blockMousedown, focusData, containerMousedown, lastSelectBlock, clearBlockFocus } =
      useFocus(data, previewRef, (e) => {
        mousedown(e);
      });
    let { mousedown, markLine } = useBlockDragger(focusData, lastSelectBlock, data);

    const { commands } = useCommand(data, focusData);
    const button = [
      {
        label: "后退",
        icon: "chexiao",
        handler: () => commands.undo(),
      },
      {
        label: "前进",
        icon: "zhongzuo",
        handler: () => commands.redo(),
      },
      {
        label: "导出",
        icon: "daochu",
        handler: () =>
          $dialog({
            title: "导出json",
            content: JSON.stringify(data.value),
            // footer: false,
          }),
      },
      {
        label: "导入",
        icon: "daoru",
        handler: () => {
          $dialog({
            title: "导入json",
            content: "",
            footer: true,
            onConfirm(text) {
              // data.value = JSON.parse(text);//无法撤销和还原
              commands.updateContainer(JSON.parse(text));
            },
          });
        },
      },
      {
        label: "置顶",
        icon: "zhiding",
        handler: () => commands.placeTop(),
      },
      {
        label: "置底",
        icon: "zhidi",
        handler: () => commands.placeBottom(),
      },
      {
        label: "删除",
        icon: "shanchu",
        handler: () => commands.delete(),
      },
      {
        label: () => (previewRef.value ? "编辑" : "预览"),
        icon: () => (previewRef.value ? "bianji" : "zitiyulan"),
        handler: () => {
          previewRef.value = !previewRef.value;
          clearBlockFocus();
        },
      },
      {
        //仅留下可视区域,左右侧和上方菜单均关闭
        label: "关闭",
        icon: "guanbi",
        handler: () => {
          editorRef.value = false;
          clearBlockFocus();
        },
      },
    ];

    const onContextmenuBlock = (e, block) => {
      e.preventDefault();
      $dropdown({
        el: e.target,
        content: () => {
          return (
            <>
              <DropdownItem label="删除" icon="shanchu" onClick={() => commands.delete()}>
                删除
              </DropdownItem>
              <DropdownItem label="置顶" icon="zhiding" onClick={() => commands.placeTop()}>
                置顶
              </DropdownItem>
              <DropdownItem label="置底" icon="zhidi" onClick={() => commands.placeBottom()}>
                置底
              </DropdownItem>
              <DropdownItem
                label="查看"
                icon="zitiyulan"
                onClick={() => {
                  $dialog({
                    title: "查看当前节点数据",
                    content: JSON.stringify(block),
                  });
                }}
              >
                查看
              </DropdownItem>
              <DropdownItem
                label="导入"
                icon="daoru"
                onClick={() => {
                  $dialog({
                    title: "导入节点数据",
                    content: "",
                    footer: true,
                    onConfirm(text) {
                      text = JSON.parse(text);
                      commands.updateBlock(text, block);
                    },
                  });
                }}
              >
                导入
              </DropdownItem>
            </>
          );
        },
      });
    };

    return () =>
      !editorRef.value ? (
        <>
          <div class="editor-container-canvas_content" style={containerStyles.value}>
            {data.value.blocks.map((block, index) => (
              <EditorBlock
                class={["editor-block-preview"]}
                block={block}
                formData={props.formData}
              ></EditorBlock>
            ))}
          </div>
          <div>
            <ElButton type="primary" onClick={() => (editorRef.value = true)}>
              继续编辑
            </ElButton>
            {JSON.stringify(props.formData)}
          </div>
        </>
      ) : (
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
              const icon = `iconfont icon-${typeof btn.icon == "function" ? btn.icon() : btn.icon}`;
              const label = typeof btn.label == "function" ? btn.label() : btn.label;
              return (
                <div class="editor-top-button" onClick={btn.handler}>
                  <i class={icon}></i>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
          <div class="editor-right">
            <EditorOperator
              block={lastSelectBlock.value}
              data={data.value}
              updateContainer={commands.updateContainer}
              updateBlock={commands.updateBlock}
            ></EditorOperator>
          </div>
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
                    class={[
                      block.focus ? "editor-block-focus" : "",
                      previewRef.value ? "editor-block-preview" : "",
                    ]}
                    block={block}
                    onMousedown={(e) => blockMousedown(e, block, index)}
                    onContextmenu={(e) => onContextmenuBlock(e, block)}
                    formData={props.formData}
                  >
                    {block.focus}
                  </EditorBlock>
                ))}
                {markLine.x !== null && (
                  <div class="line-x" style={{ left: `${markLine.x}px` }}></div>
                )}
                {markLine.y !== null && (
                  <div class="line-y" style={{ top: `${markLine.y}px` }}></div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
  },
});
