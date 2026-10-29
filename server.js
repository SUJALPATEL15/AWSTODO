const express = require('express');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const TABLE_NAME = 'TodoTable';
const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isConditionalCheckFailure(error) {
  return error.name === 'ConditionalCheckFailedException';
}

// 1. GET /api/todos - Retrieve all todos from DynamoDB
app.get('/api/todos', async (req, res) => {
  try {
    const todos = [];
    let lastEvaluatedKey;

    do {
      const result = await dynamoDB.send(new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey
      }));
      todos.push(...(result.Items || []));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    todos.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    res.json(todos);
  } catch (error) {
    console.error('Failed to retrieve todos from DynamoDB:', error);
    res.status(500).json({ error: 'Failed to retrieve todos' });
  }
});

// 2. POST /api/todos - Create a new todo in DynamoDB
app.post('/api/todos', async (req, res) => {
  try {
    const textContent = req.body.text ?? req.body.title;

    if (!textContent || typeof textContent !== 'string' || textContent.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const id = Date.now().toString();
    const newTodo = {
      id,
      completed: false,
      createdAt: new Date().toISOString(),
      ...req.body,
      id // Guarantee string id is preserved
    };

    if (typeof req.body.text === 'string') {
      newTodo.text = req.body.text.trim();
    }
    if (typeof req.body.title === 'string') {
      newTodo.title = req.body.title.trim();
    }

    await dynamoDB.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newTodo,
      ConditionExpression: 'attribute_not_exists(id)'
    }));

    return res.status(201).json(newTodo);
  } catch (error) {
    console.error('Failed to create todo in DynamoDB:', error);
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

// 3. PUT /api/todos/:id - Update an existing todo in DynamoDB
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.text !== undefined) {
      if (typeof req.body.text !== 'string' || req.body.text.trim() === '') {
        return res.status(400).json({ error: 'Todo text cannot be empty' });
      }
    }
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || req.body.title.trim() === '') {
        return res.status(400).json({ error: 'Todo title cannot be empty' });
      }
    }

    const expressionNames = { '#updatedAt': 'updatedAt' };
    const expressionValues = { ':updatedAt': new Date().toISOString() };
    const updates = ['#updatedAt = :updatedAt'];

    Object.entries(req.body).forEach(([key, value], index) => {
      if (key === 'id' || key === 'createdAt') return;
      const namePlaceholder = `#attr_${index}`;
      const valuePlaceholder = `:val_${index}`;
      expressionNames[namePlaceholder] = key;
      expressionValues[valuePlaceholder] = (typeof value === 'string' && (key === 'text' || key === 'title'))
        ? value.trim()
        : value;
      updates.push(`${namePlaceholder} = ${valuePlaceholder}`);
    });

    const result = await dynamoDB.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW'
    }));

    return res.json(result.Attributes);
  } catch (error) {
    if (isConditionalCheckFailure(error)) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Failed to update todo in DynamoDB:', error);
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

// 4. DELETE /api/todos/:id - Delete a todo from DynamoDB
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const result = await dynamoDB.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: req.params.id },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_OLD'
    }));

    return res.json({
      message: 'Todo deleted successfully',
      todo: result.Attributes
    });
  } catch (error) {
    if (isConditionalCheckFailure(error)) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    console.error('Failed to delete todo from DynamoDB:', error);
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
