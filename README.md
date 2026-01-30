# 🛒 GroceryNCart

A full-stack e-commerce application for grocery shopping with modern features and seamless user experience.

## 🌟 Features

- **User Authentication** - Secure login/register with JWT
- **Product Management** - Browse, search, and filter products
- **Shopping Cart** - Add/remove items with quantity management
- **Order Management** - Place orders with multiple payment options
- **Payment Integration** - PayPal, Stripe support
- **Admin Dashboard** - Manage products, categories, orders
- **Responsive Design** - Mobile-friendly interface
- **Image Upload** - Cloudinary integration
- **Email Notifications** - Order confirmations and updates

## 🚀 Tech Stack

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Cloudinary** - Image storage
- **Resend** - Email service

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy & web server
- **GitHub Actions** - CI/CD
- **GitLab CI** - Alternative CI/CD

## 📋 Prerequisites

- **Node.js** v20 or higher
- **MongoDB** v7.0 or higher
- **Docker** & **Docker Compose** (for containerized deployment)
- **Git**

## 🛠️ Installation

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/GroceryNCart.git
cd GroceryNCart
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Start with Docker Compose**
```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost (production) or http://localhost:5173 (dev)
- Backend: http://localhost:3000
- MongoDB: localhost:27017

### Option 2: Local Development

#### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other credentials
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 🐳 Docker Commands

We provide a Makefile for easy command execution:

```bash
# Development
make dev              # Start development environment
make dev-logs         # View development logs

# Production
make prod             # Start production environment
make deploy           # Deploy to production

# Maintenance
make backup           # Backup database
make health           # Run health checks
make clean            # Clean Docker resources

# View all commands
make help
```

Or use Docker Compose directly:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Complete deployment documentation
- **[Docker Quick Start](./DOCKER-QUICKSTART.md)** - Quick reference for Docker commands
- **[API Documentation](./API.md)** - API endpoints and usage (if available)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/groceryncart

# JWT
ACCESS_TOKEN_SECRET=your_secret_here
ACCESS_TOKEN_EXPIRY=48h
REFRESH_TOKEN_SECRET=your_refresh_secret_here
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
RESEND_API=your_resend_api_key

# Payment
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test
```

## 📦 Project Structure

```
GroceryNCart/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   └── utils/         # Utility functions
│   ├── Dockerfile         # Frontend Docker image
│   └── nginx.conf         # Nginx configuration
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── utils/         # Utility functions
│   └── Dockerfile         # Backend Docker image
├── nginx/                 # Main Nginx reverse proxy
├── scripts/               # Utility scripts
│   ├── backup.sh         # Database backup
│   ├── restore.sh        # Database restore
│   └── health-check.sh   # Health check script
├── .github/workflows/     # GitHub Actions CI/CD
├── docker-compose.yml     # Production compose file
├── docker-compose.dev.yml # Development compose file
├── Makefile              # Command shortcuts
└── DEPLOYMENT.md         # Deployment documentation
```

## 🚀 Deployment

### Using Deployment Scripts

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

**Windows:**
```powershell
.\deploy.ps1 -Environment production
```

### Manual Deployment

1. Build Docker images
```bash
docker-compose build --no-cache
```

2. Start services
```bash
docker-compose up -d
```

3. Verify deployment
```bash
docker-compose ps
./scripts/health-check.sh
```

### CI/CD

The project includes CI/CD pipelines for:
- **GitHub Actions** (`.github/workflows/ci-cd.yml`)
- **GitLab CI** (`.gitlab-ci.yml`)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed CI/CD setup instructions.

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting (Nginx)
- Security headers (Helmet.js)
- Input validation
- SQL injection prevention (Mongoose)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- React Team for the amazing framework
- Express.js for the robust backend framework
- MongoDB for the flexible database
- All contributors and supporters

## 📞 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/GroceryNCart/issues)
- **Email**: your-email@example.com

## 📸 Screenshots

![Home Page](./screenshots/home.png)
![Product Page](./screenshots/products.png)
![Cart](./screenshots/cart.png)

---

**Made with ❤️ by [Your Name](https://github.com/yourusername)**