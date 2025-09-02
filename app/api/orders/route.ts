import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import Order from "@/models/Order";
import { NextRequest, NextResponse } from "next/server";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { productId, variant } = await request.json();

        await connectToDatabase();

        // create razorpay order
        const order = await razorpay.orders.create({
            amount: Math.round(variant.price * 100),
            currency: "INR",
            receipt: `receipt-${Date.now()}`,
            notes: {
                productId: productId.toString(),
            },
        });

        const newOrder = await Order.create({
            userId: session.user.id,
            productId: productId,
            variant,
            razorpayOrderId: order.id,
            amount: Math.round(variant.price * 100),
            status: "pending",
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            dbOrderId: newOrder._id,
        });
    } catch (error) {
        console.log(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
