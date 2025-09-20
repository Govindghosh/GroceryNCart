import Stripe from "../config/stripe.js";
import CartProduct from "../models/cartproduct.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { client } from "../config/payPalPayment.js";
import paypal from "@paypal/checkout-server-sdk";
import Address from "../models/address.model.js";
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
// Helper: Calculate total amount from list_items
const calculateTotal = (items) => {
  // Sum of (price - discount) * quantity
  return items.reduce((sum, item) => {
    const price = item.productId.price || 0;
    const discount = item.productId.discount || 0;
    const qty = item.quantity || 1;
    return sum + (price - discount) * qty;
  }, 0);
};

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
    const userId = req.user._id; // from auth middleware

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

//paypal payment Controller
const paypalPaymentController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { list_items, addressId } = req.body;

  if (!list_items?.length || !addressId) {
    return res.status(400).json({
      message: "Provide list_items and addressId",
      error: true,
      success: false,
    });
  }

  // Fetch user & address
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  const userAddress = await Address.findById(addressId);
  if (!userAddress) {
    return res.status(404).json({
      message: "Address not found",
      error: true,
      success: false,
    });
  }

  // Convert INR → USD (PayPal supported)
  const INR_TO_USD = 0.012; // Approx conversion rate
  const totalAmountUSD = (calculateTotal(list_items) * INR_TO_USD).toFixed(2);

  // Map country name to ISO code
  const countryCodeMap = { India: "IN", USA: "US" };
  const countryCode = countryCodeMap[userAddress.country] || "US";

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: "default",
          amount: {
            currency_code: "USD", // PayPal-supported
            value: totalAmountUSD,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: totalAmountUSD,
              },
            },
          },
          items: list_items.map((item) => ({
            name: item.productId.name,
            unit_amount: {
              currency_code: "USD",
              value: ((item.productId.price - (item.productId.discount || 0)) * INR_TO_USD).toFixed(2),
            },
            quantity: item.quantity.toString(),
            sku: item.productId._id.toString(),
          })),
          shipping: {
            address: {
              address_line_1: userAddress.address_line,
              admin_area_2: userAddress.city,
              admin_area_1: userAddress.state,
              postal_code: userAddress.pincode,
              country_code: countryCode,
            },
          },
          custom_id: userId.toString(),
        },
      ],
      application_context: {
        brand_name: "GroceryNCart",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.CORS_ORIGIN}/success`,
        cancel_url: `${process.env.CORS_ORIGIN}/cancel`,
      },
    });

    const order = await client().execute(request);

    res.status(200).json({
      message: "PayPal order created successfully",
      success: true,
      error: false,
      orderID: order.result.id,
      links: order.result.links,
    });
  } catch (err) {
    console.error("PayPal order creation failed:", err);
    res.status(500).json({
      message: "Failed to create PayPal order",
      success: false,
      error: true,
      details: err.message,
    });
  }
});

// PayPal Webhook Handler (after payment success)
// e.g., http://localhost:8080/api/order/paypal-webhook
const paypalWebhook = asyncHandler(async (req, res) => {
  const body = req.body;
  const headers = req.headers;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID; // Your PayPal webhook ID from dashboard

  try {
    // Verify PayPal webhook signature
    const verifyRequest = new paypal.notifications.WebhookEventVerifySignatureRequest();
    verifyRequest.requestBody({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: body,
    });

    const verification = await client().execute(verifyRequest);

    if (verification.result.verification_status !== "SUCCESS") {
      console.log("PayPal webhook verification failed");
      return res.status(400).json({ message: "Webhook verification failed" });
    }

    console.log("Verified PayPal webhook:", body.event_type);

    switch (body.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
      case "PAYMENT.CAPTURE.COMPLETED":
        const resource = body.resource;

        // Capture order if not automatically captured
        let captureId;
        let paymentStatus;
        if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
          const orderId = resource.id;
          const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
          captureRequest.requestBody({});
          const captureResponse = await client().execute(captureRequest);
          captureId = captureResponse.result.id;
          paymentStatus = captureResponse.result.status;
        } else if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
          captureId = resource.id;
          paymentStatus = resource.status;
        }

        // Extract userId and addressId (pass via custom_id or metadata in order creation)
        const userId = resource.purchase_units?.[0]?.custom_id || null;
        const addressId = resource.purchase_units?.[0]?.shipping?.address?.id || null;

        // Map PayPal items to orderProduct
        const lineItems = resource.purchase_units?.[0]?.items || [];
        const orderProduct = await getOrderProductItems({
          lineItems,
          userId,
          addressId,
          paymentId: captureId,
          payment_status: paymentStatus,
        });

        const order = await Order.insertMany(orderProduct);
        console.log("PayPal Order created:", order);

        if (order.length && userId) {
          await User.findByIdAndUpdate(userId, { shopping_cart: [] });
          await CartProduct.deleteMany({ userId });
        }
        break;

      default:
        console.log(`Unhandled PayPal event type: ${body.event_type}`);
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    res.status(500).json({ message: "Webhook handling failed", error: err.message });
  }
});

export {
    CashOnDeliveryOrderController,
    paymentController,
    webhookStripe,
    getOrderDetailsController,
    priceWithDiscount,
    paypalPaymentController,
    paypalWebhook
}