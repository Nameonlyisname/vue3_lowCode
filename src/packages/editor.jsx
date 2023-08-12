import { computed, defineComponent, inject } from "vue";
import "./editor.scss";
import EditorBlock from "./editor-block";
export default defineComponent({
  props: {
    modelValue: {
      type: Object,
    },
  },
  setup: (props) => {
    const data = computed({
      get() {
        return props.modelValue;
      },
    });

    const containerStyles = computed(() => ({
      width: `${data.value.container.width}px`,
      height: `${data.value.container.height}px`,
    }));

    const config = inject("config");
    return () => (
      <div class="editor">
        <div class="editor-left">
          {config.componentList.map((component) => (
            <div class="editor-left-item">
              <span>{component.label}</span>
              <div>{component.preview()}</div>
            </div>
          ))}
        </div>
        <div class="editor-middle">
          <div class="editor-middle-top">菜单</div>
          <div class="editor-middle-container">
            {/* 负责产生滚动条 */}
            <div class="editor-middle-container-canvas">
              {/* 负责内容区 */}
              <div class="editor-middle-container-canvas_content" style={containerStyles.value}>
                {data.value.blocks.map((block) => (
                  <EditorBlock block={block}></EditorBlock>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div class="editor-right">属性栏</div>
      </div>
    );
  },
});
