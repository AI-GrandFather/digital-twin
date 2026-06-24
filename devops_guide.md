# DevOps Core Concepts: Terraform & GitHub Actions

This guide explains the foundational concepts of **Infrastructure as Code (IaC)** with Terraform and **Continuous Integration / Continuous Deployment (CI/CD)** with GitHub Actions.

---

## Part 1: Terraform Core Concepts

Think of Terraform as an **architect's blueprint builder** for your cloud. You write the blueprints in files, and Terraform builds the actual buildings (servers, databases, networks) on AWS.

| Term | What it is | Example in your codebase |
| :--- | :--- | :--- |
| **1. Provider** | The plugin that connects Terraform to a specific cloud platform. | `provider "aws"` inside [versions.tf](file:///Users/atharmushtaq/projects/twin/terraform/versions.tf) |
| **2. Resource** | The actual infrastructure objects you want to create. | `resource "aws_s3_bucket" "memory"` in [main.tf](file:///Users/atharmushtaq/projects/twin/terraform/main.tf) |
| **3. Variable (Input)** | Customizable parameter inputs for your blueprint. | `variable "openai_api_key"` in [variables.tf](file:///Users/atharmushtaq/projects/twin/terraform/variables.tf) |
| **4. Output** | Values printed to the screen after a successful deploy. | `output "cloudfront_url"` in [outputs.tf](file:///Users/atharmushtaq/projects/twin/terraform/outputs.tf) |
| **5. Data Source** | Read-only query to fetch existing settings from AWS. | `data "aws_caller_identity" "current"` in [main.tf](file:///Users/atharmushtaq/projects/twin/terraform/main.tf) |
| **6. Local (Locals)** | Internal calculated variables to prevent code repetition. | `locals { name_prefix = ... }` in [main.tf](file:///Users/atharmushtaq/projects/twin/terraform/main.tf) |
| **7. State** | Terraform's memory file (`.tfstate`) tracking what actually exists. | Created automatically as `terraform.tfstate` (never edit this manually!). |
| **8. Workspace** | Isolated environments (`dev`, `test`, `prod`) using the same code. | Managed via [deploy.sh](file:///Users/atharmushtaq/projects/twin/scripts/deploy.sh) using `terraform workspace select/new`. |

---

## Part 2: GitHub Actions Core Concepts

Think of GitHub Actions as a **robotic assembly line** (pipeline). Every time you push new code to GitHub, the pipeline starts automatically, tests your code, builds the files, and deploys them to AWS.

### 1. Workflow
* **What it is**: The entire automated process. It is defined in a YAML configuration file inside the `.github/workflows/` directory in your repository.
* **Analogy**: The instruction manual for the entire assembly line.

### 2. Event (Trigger)
* **What it is**: The specific activity that kicks off the workflow automatically.
* **Examples**: 
  * `push` (when you commit and push code to the `main` branch).
  * `pull_request` (when you submit a pull request for review).
  * `workflow_dispatch` (a manual button in GitHub to start the run).
* **Analogy**: The sensor that detects a new package on the conveyor belt and starts the motors.

### 3. Job
* **What it is**: A set of steps executed in sequence on a runner server. By default, if a workflow has multiple jobs, they run in parallel (at the same time) unless you tell one to wait for another.
* **Analogy**: An individual station in the assembly line (e.g., Station 1: Tests, Station 2: Deploy).

### 4. Step
* **What it is**: An individual task inside a Job. A step can run shell commands (like `npm run build`) or execute pre-made plugins (Actions).
* **Analogy**: A single motion by a robot arm at a station.

### 5. Action
* **What it is**: Reusable packaged code plugins that solve common developer tasks. You call them using the `uses:` keyword.
* **Examples**:
  * `actions/checkout@v4` (pulls your code from GitHub into the server).
  * `actions/setup-python@v5` (installs Python on the server).
  * `hashicorp/setup-terraform@v3` (installs Terraform on the server).
* **Analogy**: A standard tool attachment for the robot arm (e.g., a screwdriver attachment).

### 6. Runner
* **What it is**: The actual server container hosted by GitHub (usually running Linux Ubuntu) where the workflow jobs execute.
* **Analogy**: The physical factory floor and electricity powering the machinery.

### 7. Secrets
* **What it is**: Encrypted variables (like AWS Credentials or API keys) that you configure in your GitHub Repository settings. GitHub masks them in the logs so they are never leaked, but your runner scripts can read them to authenticate with AWS or Groq.
* **Analogy**: A combination-locked safe on the factory floor that the robotic arms can unlock to get credentials, without showing them to visitors.
