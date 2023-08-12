import { computed, defineComponent } from "vue";
export default defineComponent({
  props: {
    block: { type: Object },
  },
  setup: (props) => {
    const blockStyles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}`,
    }));
    console.log(blockStyles.top);
    return () => (
      <div class="editor-block" style={blockStyles.value}>
        代码块
      </div>
    );
  },
});
