import deepcopy from "deepcopy";
import { events } from "./events";
import { onUnmounted } from "vue";

export function useCommand(data, focusData) {
  const state = {
    current: -1, //索引
    queue: [], //所有操作
    commands: {}, //命令与执行映射
    commandArray: [], //命令存放
    destroyArray: [],
  };

  const registry = (command) => {
    state.commandArray.push(command);
    state.commands[command.name] = (...args) => {
      const { redo, undo } = command.execute(...args);
      redo();
      if (!command.pushQueue) return;
      let { queue, current } = state;

      if (queue.length > 0) {
        queue = queue.slice(0, current + 1);
        state.queue = queue;
      }

      queue.push({ redo, undo });
      state.current = current + 1;
    };
  };

  registry({
    name: "redo",
    keyboard: "ctrl+y",
    execute() {
      return {
        redo() {
          let item = state.queue[state.current + 1];
          if (item) {
            item.redo && item.redo();
            state.current++;
          }
        },
      };
    },
  });

  registry({
    name: "undo",
    keyboard: "ctrl+z",
    execute() {
      return {
        redo() {
          if (state.current.length == -1) return;
          let item = state.queue[state.current];
          if (item) {
            item.undo && item.undo();
            state.current--;
          }
        },
      };
    },
  });

  registry({
    name: "drag",
    pushQueue: true,
    init() {
      this.before = null;
      const start = () => (this.before = deepcopy(data.value.blocks)); //拖拽前保留上次的数据状态
      const end = () => state.commands.drag();
      events.on("start", start);
      events.on("end", end);

      return () => {
        events.off("start", start);
        events.off("end", end);
      };
    },
    execute() {
      let before = this.before;
      let after = data.value.blocks;
      return {
        redo() {
          //撤销
          data.value = { ...data.value, blocks: after };
        },
        undo() {
          //还原
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });

  registry({
    name: "updateContainer",
    pushQueue: true,
    execute(newValue) {
      let state = {
        before: data.value,
        after: newValue,
      };
      return {
        redo: () => {
          data.value = state.after;
        },
        undo: () => {
          data.value = state.before;
        },
      };
    },
  });

  registry({
    name: "placeTop",
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks);
      let after = (() => {
        let { focus, unfocused } = focusData.value;
        let maxZIndex = unfocused.reduce((prev, block) => Math.max(prev, block.zIndex), -Infinity);
        focus.forEach((block) => (block.zIndex = maxZIndex + 1));
        return data.value.blocks;
      })();

      return {
        redo: () => {
          data.value = { ...data.value, blocks: after };
        },

        undo: () => {
          // blocks旧数据与当前数据一致，不会更新
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });

  registry({
    name: "placeBottom",
    pushQueue: true,
    execute() {
      let before = deepcopy(data.value.blocks);
      let after = (() => {
        let { focus, unfocused } = focusData.value;
        let minZIndex =
          unfocused.reduce((prev, block) => Math.min(prev, block.zIndex), Infinity) - 1;

        // zIndex为负值(不断的点击置底)可能会导致看不到组件
        // focus.forEach((block) => (block.zIndex = minZIndex - 1));
        if (minZIndex < 0) {
          const dur = Math.abs(minZIndex);
          minZIndex = 0;
          unfocused.forEach((block) => (block.zIndex += dur));
        }
        focus.forEach((block) => (block.zIndex = minZIndex));

        return data.value.blocks;
      })();

      return {
        redo: () => {
          data.value = { ...data.value, blocks: after };
        },

        undo: () => {
          // blocks旧数据与当前数据一致，不会更新
          data.value = { ...data.value, blocks: before };
        },
      };
    },
  });

  registry({
    name: "delete",
    pushQueue: true,
    execute() {
      let state = {
        before: deepcopy(data.value.blocks),
        after: focusData.value.unfocused,
      };
      return {
        redo: () => {
          data.value = { ...data.value, blocks: state.after };
        },

        undo: () => {
          data.value = { ...data.value, blocks: state.before };
        },
      };
    },
  });

  const keyboardEvent = (() => {
    const keyCodes = { 90: "z", 89: "y" };

    const onKeydown = (e) => {
      const { ctrlKey, keyCode } = e;
      let keyString = [];
      if (ctrlKey) keyString.push("ctrl");
      keyString.push(keyCodes[keyCode]);
      keyString = keyString.join("+");
      state.commandArray.forEach(({ keyboard, name }) => {
        if (!keyboard) return;
        if (keyboard === keyString) {
          state.commands[name]();
          e.preventDefault();
        }
      });
    };

    const init = () => {
      window.addEventListener("keydown", onKeydown);
      return () => {
        window.removeEventListener("keydown", onKeydown);
      };
    };
    return init;
  })();

  (() => {
    state.destroyArray.push(keyboardEvent());
    state.commandArray.forEach(
      (command) => command.init && state.destroyArray.push(command.init())
    );
  })();

  onUnmounted(() => {
    state.destroyArray.forEach((fn) => fn && fn());
  });
  return state;
}
