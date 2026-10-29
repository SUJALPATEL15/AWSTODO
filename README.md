# AWSTODO - Cloud-Ready To-Do List Application

A simple, fast, and responsive To-Do List web application built with **Node.js**, **Express**, and **Vanilla HTML/CSS/JavaScript**. Designed to run seamlessly on local machines and cloud servers (such as AWS EC2).

## Features

- **Full REST API** backed by Express:
  - `GET /api/todos`: Retrieve all todos
  - `POST /api/todos`: Create a new task
  - `PUT /api/todos/:id`: Update task completion status or edit task text
  - `DELETE /api/todos/:id`: Delete a task
- **Persistent Storage**: Tasks are stored in AWS DynamoDB using the `TodoTable` table.
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

3. Create a DynamoDB table named `TodoTable` with a String partition key named `id` and no sort key. The server uses the AWS default credential provider chain; on EC2, attach an IAM role with permission to scan, put, update, and delete items in this table.

4. Optionally set `AWS_REGION` to your table's region. It defaults to `ap-south-1`.

5. Start the server:
   ```bash
   npm start
   ```

6. Open in your browser:
   - Locally: `http://localhost:3000`
   - On a Cloud Server (e.g. AWS EC2): `http://<your-server-public-ip>:3000` (make sure port `3000` is open in your Security Group inbound rules).
