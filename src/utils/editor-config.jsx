import { ElButton,ElInput } from "element-plus";

// 列表区显示所有物料
function createEditorConfig() {
  const componentList = [];
  const componentMap = {};

  return {
    componentList,
    componentMap,
    register: (component) => {
      componentList.push(component);
      componentMap[component.key] = component;
    },
  };
}

export let registerConfig = createEditorConfig();

registerConfig.register({
  label: "文本",
  preview: () => "预览文本",
  render: () => "渲染文本",
  key: "text",
});

registerConfig.register({
  label: "按钮",
  preview: () => <ElButton type="primary">预览</ElButton>,
  render: () => <ElButton type="primary">渲染</ElButton>,
  key: "button",
});

registerConfig.register({
  label: "输入框",
  preview: () => <ElInput placeholder="预览输入">预览</ElInput>,
  render: () => <ElInput placeholder="渲染输入">渲染</ElInput>,
  key: "input",
});
