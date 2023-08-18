import { computed, defineComponent, inject, onMounted, ref } from "vue";
export default defineComponent({
  name: "Editor-Block",
  props: {
    block: { type: Object },
    formData: Object,
  },
  setup: (props) => {
    const blockStyles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
      zIndex: `${props.block.zIndex}`,
    }));
    const config = inject("config");
    const blockRef = ref(null);

    onMounted(() => {
      let { offsetWidth, offsetHeight } = blockRef.value;

      if (props.block.alignCenter) {
        props.block.left = props.block.left - offsetWidth / 2;
        props.block.top = props.block.top - offsetHeight / 2;
        props.block.alignCenter = false;
      }
      props.block.width = offsetWidth;
      props.block.height = offsetHeight;
    });
    return () => {
      const component = config.componentMap[props.block.key];
      const RenderComponent = component.render({
        props: props.block.props,
        model: Object.keys(component.model || {}).reduce((prev, modelName) => {
          let propName = props.block.model[modelName];
          prev[modelName] = {
            modelValue: props.formData[propName],
            "onUpdate:modelValue": (v) => (props.formData[propName] = v),
          };
          return prev;
        }, {}),
      });
      return (
        <div class="editor-block" style={blockStyles.value} ref={blockRef}>
          {RenderComponent}
        </div>
      );
    };
  },
});
