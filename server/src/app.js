import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import addressRouter from './route/address.route.js'
import orderRouter from './route/order.route.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()
// CORS config
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser())
app.use(morgan("dev"));
app.use(helmet({
  crossOriginResourcePolicy: false
}))

app.get("/", (request, response) => {
  ///server to client
  response.json({
    message: "Server is running " + process.env.PORT
  })
})

app.use('/api/user', userRouter)
app.use('/api/category', categoryRouter)
app.use('/api/subcategory', subCategoryRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)

// Error handling middleware (must be last)
app.use(errorHandler)

export default app;
