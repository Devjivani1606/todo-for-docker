import { useState,useEffect } from "react";
import axios from "axios";

function App() {

  const [task,setTask] = useState("");
  const [todos,setTodos] = useState([]);

  const loadTodos = async () => {

    const res = await axios.get(
      "http://localhost:5000/todos"
    );

    setTodos(res.data);
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const addTodo = async () => {

    await axios.post(
      "http://localhost:5000/todos",
      {
        text:task
      }
    );

    setTask("");

    loadTodos();
  };

  return (
    <div>

      <h1>Todo App</h1>

      <input
        value={task}
        onChange={(e)=>setTask(e.target.value)}
      />

      <button onClick={addTodo}>
        Add
      </button>

      {
        todos.map(todo => (
          <div key={todo.id}>
            {todo.text}
          </div>
        ))
      }

    </div>
  );
}

export default App;