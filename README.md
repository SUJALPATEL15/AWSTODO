# AWSTODO - Cloud-Ready To-Do List Application with AWS DynamoDB

A simple, fast, and responsive To-Do List web application built with **Node.js**, **Express**, and **Vanilla HTML/CSS/JavaScript**, backed by **Amazon DynamoDB**. Designed to run seamlessly on local machines and cloud servers (such as AWS EC2).

## Features

- **Full REST API** backed by Express & AWS DynamoDB:
  - `GET /api/todos`: Retrieve all todos
  - `POST /api/todos`: Create a new task
  - `PUT /api/todos/:id`: Update task completion status or edit task text
  - `DELETE /api/todos/:id`: Delete a task
- **AWS DynamoDB Storage**:
  - Table name: `TodoTable`
  - Partition key: `id` (String)
  - Region: `process.env.AWS_REGION || 'ap-south-1'`
  - AWS SDK v3 (`@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`)
  - Uses the default AWS credential chain (supports EC2 IAM instance profile roles)
- **Modern & Mobile-Friendly UI**:
  - Task status filters: All, Active, Completed
  - In-place task editing
  - Custom responsive styling with zero heavy frameworks
  - Toast notifications and remaining task counter
- **Cloud-Ready**: Server binds to `0.0.0.0` to accept external network traffic.

## File Structure

```text
├── .gitignore
├── package.json
├── server.js
├── README.md
└── public/
    └── index.html
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm
- AWS DynamoDB table named `TodoTable` with partition key `id` (String)
- AWS credentials configured (or an IAM Role attached to the EC2 instance)

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/SUJALPATEL15/AWSTODO.git
   cd AWSTODO
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open in your browser:
   - Locally: `http://localhost:3000`
   - On a Cloud Server (e.g. AWS EC2): `http://<your-server-public-ip>:3000` (ensure port `3000` is open in your Security Group inbound rules).
