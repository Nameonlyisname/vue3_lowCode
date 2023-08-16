import deepcopy from "deepcopy";
import { events } from "./events";
import { onUnmounted } from "vue";

export function useCommand(data) {
  const state = {
    current: -1, //索引
    queue: [], //所有操作
    commands: {}, //命令与执行映射
    commandArray: [], //命令存放
    destroyArray: [],
  };

  const registry = (command) => {
    state.commandArray.push(command);
    state.commands[command.name] = () => {
      const { redo, undo } = command.execute();
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

  (() => {
    state.commandArray.forEach(
      (command) => command.init && state.destroyArray.push(command.init())
    );
  })();

  onUnmounted(() => {
    state.destroyArray.forEach((fn) => fn && fn());
  });
  return state;
}
