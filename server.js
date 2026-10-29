const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Read todos from file
async function getTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveTodos([]);
      return [];
    }
    console.error('Error reading todos.json:', error.message);
    throw error;
  }
}

// Helper: Save todos to file
async function saveTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// Routes

// 1. GET /api/todos - Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await getTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve todos' });
  }
});

// 2. POST /api/todos - Create a new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todos = await getTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.unshift(newTodo);
    await saveTodos(todos);

    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// 3. PUT /api/todos/:id - Update an existing todo (text, completed status)
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;

    const todos = await getTodos();
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (typeof text === 'string') {
      if (text.trim() === '') {
        return res.status(400).json({ error: 'Todo text cannot be empty' });
      }
      todos[todoIndex].text = text.trim();
    }

    if (typeof completed === 'boolean') {
      todos[todoIndex].completed = completed;
    }

    todos[todoIndex].updatedAt = new Date().toISOString();

    await saveTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// 4. DELETE /api/todos/:id - Delete a todo by ID
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const todos = await getTodos();
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0];
    await saveTodos(todos);

    res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;


