# 🐳 Docker & Docker Networking: A Practical Learning Guide

This guide is designed to help you understand the core concepts of Docker, with a special focus on **Docker Networking** and how multi-container applications (like this React frontend, Express backend, and MySQL database setup) communicate with each other.

---

## 🧭 Table of Contents
1. [Core Docker Concepts](#-core-docker-concepts)
2. [What is Docker Networking?](#-what-is-docker-networking)
3. [Types of Docker Networks](#-types-of-docker-networks)
4. [How Our Todo App Uses Networking](#-how-our-todo-app-uses-networking)
5. [Docker Networking Commands Cheat Sheet](#-docker-networking-commands-cheat-sheet)
6. [Step-by-Step Deployment Walkthrough](#-step-by-step-deployment-walkthrough)

---

## 🧠 Core Docker Concepts

Before diving into networking, it is important to understand the fundamental building blocks of Docker:

*   **Dockerfile**: A text document containing all the commands a user could call on the command line to assemble a Docker Image.
*   **Image**: A read-only template that contains the source code, libraries, dependencies, and environment configuration needed to run an application.
*   **Container**: A runnable, isolated instance of an Image. You can think of an Image as the blueprint, and a Container as the actual built house.

### Common Dockerfile Instructions:
*   `FROM`: Sets the base image (e.g., `node:22`).
*   `WORKDIR`: Sets the working directory inside the container.
*   `COPY`: Copies files from your local host machine into the container.
*   `RUN`: Executes commands *during the build process* (e.g., `npm install`).
*   `EXPOSE`: Informs Docker that the container listens on specified network ports at runtime.
*   `CMD`: Specifies the command to execute *when the container starts* (e.g., `npm start`).

---

## 🌐 What is Docker Networking?

By default, Docker containers are isolated units. They cannot talk to the host machine or other containers unless we establish a connection. 

**Docker Networking** allows containers to communicate with:
1. One another securely.
2. The host machine.
3. External networks (like the public internet).

Docker uses a **Container Network Model (CNM)** to manage networking. When you run containers, Docker automatically provides a built-in **DNS server** that allows containers on the same custom network to reference each other by their **container name** instead of their dynamic IP addresses.

---

## ⚡ Types of Docker Networks

Docker supports several driver types depending on your needs:

| Network Driver | Description | Best For |
| :--- | :--- | :--- |
| **Bridge** | The default network driver. Containers on the same bridge network can communicate. Custom user-defined bridge networks enable automatic DNS name resolution. | Standalone multi-container apps (like ours) |
| **Host** | Removes network isolation between the container and the Docker host. The container uses the host's networking directly. | High-performance standalone containers |
| **None** | Completely disables networking for the container. | High security/isolated batch processing tasks |
| **Overlay** | Connects multiple Docker daemons together across different host machines. | Distributed microservices (Docker Swarm / Kubernetes) |

---

## 🏗️ How Our Todo App Uses Networking

Our application consists of three standalone containers running on a custom bridge network called `todo-network`:

```mermaid
graph TD
    subgraph Host Machine
        Browser[Client Browser (localhost:3000)]
    end

    subgraph Custom Docker Bridge Network (todo-network)
        frontend[frontend container]
        backend[backend container]
        mysql[mysql-db container]
    end

    Browser -->|Port 3000| frontend
    Browser -->|Port 5000| backend
    backend -->|DNS Name: 'mysql-db' on Port 3306| mysql
```

### 1. The Database (`mysql-db`)
*   Runs using the official `mysql:8.0` image.
*   Joined to `todo-network` with the name `mysql-db`.
*   Exposes port `3306` inside the network.

### 2. The Backend (`backend`)
*   Runs our Node/Express API server.
*   Joined to `todo-network` with the name `backend`.
*   In `server.js`, it connects to MySQL using the host address `"mysql-db"` instead of an IP address:
    ```javascript
    const db = mysql.createConnection({
      host: "mysql-db", // Docker DNS resolves this to the database container's IP!
      user: "root",
      password: "root123",
      database: "todo_db"
    });
    ```
*   Its internal port `5000` is mapped to the host's port `5000` (`-p 5000:5000`) so the browser client can reach the API.

### 3. The Frontend (`frontend`)
*   Runs the React user interface.
*   Its internal port `3000` is mapped to the host's port `3000` (`-p 3000:3000`) so you can access it at `http://localhost:3000`.
*   *Note:* The React code runs **inside the user's browser (client-side)**, not inside Docker. Therefore, it makes API calls to `http://localhost:5000/todos` (referencing the host machine's port mapping) rather than `"backend:5000"`.

---

## 🛠️ Docker Networking Commands Cheat Sheet

Here are the essential commands you use to manage networks:

*   **List all networks**:
    ```bash
    docker network ls
    ```
*   **Create a custom bridge network**:
    ```bash
    docker network create todo-network
    ```
*   **Inspect a network** (shows connected containers, subnet settings, and IPs):
    ```bash
    docker network inspect todo-network
    ```
*   **Connect a running container to a network**:
    ```bash
    docker network connect todo-network <container-name>
    ```
*   **Disconnect a container from a network**:
    ```bash
    docker network disconnect todo-network <container-name>
    ```
*   **Remove a network**:
    ```bash
    docker network rm todo-network
    ```

---

## 🚀 Step-by-Step Deployment Walkthrough

To spin up this entire network and application stack from scratch, run the following commands:

### Step 1: Create the custom bridge network
```bash
docker network create todo-network
```

### Step 2: Spin up the MySQL Database container
We run it detached (`-d`), connect it to our network (`--network`), set the name (`--name`), configure the root password environment variable (`-e`), and map host port 3306:
```bash
docker run -d \
  --name mysql-db \
  --network todo-network \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=todo_db \
  -p 3306:3306 \
  mysql:8.0
```

### Step 3: Build and run the Backend API
Build the image from `./backend/Dockerfile`:
```bash
docker build -t todo-backend:latest ./backend
```
Run the backend container attached to the network and mapping port `5000`:
```bash
docker run -d \
  --name backend \
  --network todo-network \
  -p 5000:5000 \
  todo-backend:latest
```

### Step 4: Build and run the Frontend UI
Build the image from `./frontend/Dockerfile`:
```bash
docker build -t todo-frontend:latest ./frontend
```
Run the frontend container mapping port `3000`:
```bash
docker run -d \
  --name frontend \
  -p 3000:3000 \
  todo-frontend:latest
```

### Step 5: Verify the setup
Open your browser and navigate to:
*   Frontend UI: [http://localhost:3000](http://localhost:3000)
*   Backend API Endpoint: [http://localhost:5000/todos](http://localhost:5000/todos)
