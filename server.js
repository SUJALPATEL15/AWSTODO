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

app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

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

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    const expressionNames = { '#updatedAt': 'updatedAt' };
    const expressionValues = { ':updatedAt': new Date().toISOString() };
    const updates = ['#updatedAt = :updatedAt'];

    if (typeof text === 'string') {
      if (text.trim() === '') {
        return res.status(400).json({ error: 'Todo text cannot be empty' });
      }
      expressionNames['#text'] = 'text';
      expressionValues[':text'] = text.trim();
      updates.push('#text = :text');
    }

    if (typeof completed === 'boolean') {
      expressionNames['#completed'] = 'completed';
      expressionValues[':completed'] = completed;
      updates.push('#completed = :completed');
    }

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

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
