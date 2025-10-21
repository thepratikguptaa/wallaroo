import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");
        if (!signature) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);

        await connectToDatabase();

        if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: payment.order_id },
                {
                    razorpayPaymentId: payment.id,
                    status: "completed",
                }
            ).populate([
                { path: "productId", select: "name" },
                { path: "userId", select: "email" },
            ]);

            if (order) {
                const transporter = nodemailer.createTransport({
                    service: "sandbox.smtp.mailtrap.io",
                    port: 2525,
                    auth: {
                        user: process.env.MAILTRAP_USER,
                        pass: process.env.MAILTRAP_PASSWORD,
                    },
                });

                await transporter.sendMail({
                    from: "wallaroo@wallaroo.com",
                    to: order.userId.email,
                    subject: "Order Completed",
                    text: `Your order ${order.productId.name} has been successfully placed`,
                });
            }
        }

        return NextResponse.json({ message: "Success" }, { status: 200 });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
