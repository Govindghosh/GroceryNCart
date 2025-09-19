import Stripe from "../config/stripe.js";
import CartProduct from "../models/cartproduct.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Helper: Calculate discounted price
const priceWithDiscount = (price, discount = 0) => {
  const discountAmount = Math.ceil((Number(price) * Number(discount)) / 100);
  const actualPrice = Number(price) - discountAmount;
  return actualPrice;
};
// Helper: Convert Stripe line items to Order payloads
const getOrderProductItems = asyncHandler(
  async (
    lineItems,
    userId,
    addressId,
    paymentId = "",
    payment_status = "PENDING"
  ) => {
    if (!lineItems?.data?.length) return [];

    const productPromises = lineItems.data.map(async (item) => {
      try {
        const product = await Stripe.products.retrieve(item.price.product);
        const productId = product.metadata?.productId;
        if (!productId) return null;

        return {
          userId,
          orderId: `ORD-${new mongoose.Types.ObjectId().toString()}`,
          productId,
          product_details: {
            name: product.name,
            image: product.images || [],
          },
          paymentId,
          payment_status,
          delivery_address: addressId,
          subTotalAmt: Number(item.amount_subtotal / 100),
          totalAmt: Number(item.amount_total / 100),
        };
      } catch (err) {
        console.error("Stripe product retrieval failed:", err.message);
        return null;
      }
    });

    const productList = await Promise.all(productPromises);
    return productList.filter((p) => p !== null);
  }
);
// Stripe Payment Checkout Session Controller
const paymentController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // auth middleware
  const { list_items, totalAmt, addressId, subTotalAmt } = req.body;

  if (!list_items?.length || !addressId) {
    return res.status(400).json({
      message: "Provide list_items and addressId",
      error: true,
      success: false,
    });
  }
  // Fetch user
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  const line_items = list_items.map((item) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: item.productId.name,
        images: Array.isArray(item.productId.image)
          ? item.productId.image
          : [item.productId.image],
        metadata: {
          productId: item.productId._id.toString(),
        },
      },
      unit_amount: priceWithDiscount(
        item.productId.price,
        item.productId.discount
      ) * 100, // Stripe expects amount in paise
    },
    adjustable_quantity: {
      enabled: true,
      minimum: 1,
      maximum: item.productId.stock || 100,
    },
    quantity: item.quantity,
  }));

  const params = {
    submit_type: "pay",
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: user.email,
    metadata: {
      userId: userId.toString(),
      addressId: addressId.toString(),
    },
    line_items,
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  };

  const session = await Stripe.checkout.sessions.create(params);

  return res.status(200).json({
    message: "Stripe session created successfully",
    error: false,
    success: true,
    session,
  });
});

// Stripe Webhook Handler (after payment success)
//http://localhost:8080/api/order/webhook
const webhookStripe = asyncHandler(async (req, res) => {
  const event = req.body;
  const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

  console.log("event", event);

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
      const userId = session.metadata.userId;

      const orderProduct = await getOrderProductItems({
        lineItems,
        userId,
        addressId: session.metadata.addressId,
        paymentId: session.payment_intent,
        payment_status: session.payment_status,
      });

      const order = await Order.insertMany(orderProduct);

      console.log("Order created:", order);

      if (order.length) {
        await User.findByIdAndUpdate(userId, { shopping_cart: [] });
        await CartProduct.deleteMany({ userId });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Acknowledge receipt
  res.json({ received: true });
});

const CashOnDeliveryOrderController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // auth middleware
  const { list_items, totalAmt, addressId, subTotalAmt } = req.body;

  // Validate input
  if (!list_items || !list_items.length) {
    return res.status(400).json({
      message: "No items to order",
      error: true,
      success: false,
    });
  }

  if (!totalAmt || !addressId) {
    return res.status(400).json({
      message: "Total amount and addressId are required",
      error: true,
      success: false,
    });
  }

  const payload = list_items.map((el) => ({
    userId,
    orderId: `ORD-${new mongoose.Types.ObjectId()}`,
    productId: el.productId._id,
    product_details: {
      name: el.productId.name,
      image: el.productId.image,
    },
    paymentId: "",
    payment_status: "CASH ON DELIVERY",
    delivery_address: addressId,
    subTotalAmt: subTotalAmt || 0,
    totalAmt: totalAmt,
    quantity: el.quantity || 1,
    createdAt: new Date(),
  }));

  // Save order
  const generatedOrder = await Order.insertMany(payload);

  // Remove items from cart
  await CartProduct.deleteMany({ userId });
  await User.updateOne({ _id: userId }, { $set: { shopping_cart: [] } });

  return res.json({
    message: "Order placed successfully",
    error: false,
    success: true,
    data: generatedOrder,
  });
});

// Get Order Details Controller
const getOrderDetailsController = asyncHandler(async (req, res) => {
    const userId = req.userId; // from auth middleware

    const orderlist = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate("delivery_address");

    return res.json({
        message: "Order list",
        data: orderlist,
        error: false,
        success: true,
    });
});

export {
    CashOnDeliveryOrderController,
    paymentController,
    webhookStripe,
    getOrderDetailsController,
    priceWithDiscount
}