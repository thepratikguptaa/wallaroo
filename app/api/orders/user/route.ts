import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const orders = await Order.find({ userId: session.user.id }).populate({
            path: "productId",
            select: "name imageUrl",
            options: { strictPopulate: false },
        });

        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
