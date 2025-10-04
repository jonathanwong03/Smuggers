# NASA TEMPO Air Quality Forecast App

This project is a web-based application to forecast air quality by integrating real-time data from NASA's TEMPO mission, ground-based measurements, and weather data.

## Project Structure

-   `/backend`: Node.js and Express.js server.
-   `/frontend`: React.js client application.

## How to Run

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd c:\nasa\Smuggers\backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will be running on `http://localhost:3001`.

### Frontend

1.  Open a new terminal and navigate to the `frontend` directory:
    ```bash
    cd c:\nasa\Smuggers\frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the React development server:
    ```bash
    npm start
    ```
    The application will open in your browser at `http://localhost:3000`.

The frontend is configured to proxy API requests to the backend server, so you can start developing right away.
