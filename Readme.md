How to Run the Application

    Prerequisites:

        Node.js 18+

        PostgreSQL 14+

        npm or yarn

    Setup:
    bash

# Clone the repository

git clone https://github.com/nigamastitva/Lumel-Astitva-SalesAnalysisAssignment.git
cd sales-analysis-api

# Install dependencies

npm install

# Set up environment variables

cp .env.example .env

# Edit .env with your database credentials

# Run database migrations

npx prisma migrate dev

# Start the development server

npm run dev

The API will run on http://localhost:3000/api/v1

API Documentation

API Endpoints

| **Route**                               | **Method** | **Description**               | **Request Body**                                                                                                                                                                                                            | **Sample Response**                                                                                |
| --------------------------------------- | ---------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/api/v1/segments`                      | POST       | Create a new customer segment | `{ name: string, description?: string, criteria: { minPurchases?: number, maxPurchases?: number, minRevenue?: number, maxRevenue?: number, categories?: string[], regions?: string[], startDate?: Date, endDate?: Date } }` | `{ id: string, name: string, description: string, criteria: object, createdAt: string }`           |
| `/api/v1/segments/:segmentId/customers` | GET        | Get customers in a segment    | -                                                                                                                                                                                                                           | `{ customers: Customer[], total: number }`                                                         |
| `/api/v1/segments`                      | GET        | List all segments             | -                                                                                                                                                                                                                           | `{ data: Segment[], meta: { page: number, limit: number, total: number, totalPages: number } }`    |
| `/api/v1/data/refresh`                  | POST       | Trigger data refresh          | `{ filePath: string }`                                                                                                                                                                                                      | `{ id: string, status: string, recordsProcessed: number, startedAt: string, completedAt: string }` |
| `/api/v1/data/logs`                     | GET        | Get data refresh logs         | -                                                                                                                                                                                                                           | `{ data: Log[], meta: { page: number, limit: number, total: number, totalPages: number } }`        |
