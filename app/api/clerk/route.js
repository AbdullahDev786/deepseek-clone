// import { Webhook } from "svix";
// import connectDB from "@/config/db";
// import User from "@/models/User";
// import { headers } from "next/headers";
// import { NextRequest } from "next/server";


// export async function POST(req){
//     const wh = new Webhook(process.env.SIGNING_SECRET);
//     const headerPayLoad = await headers();
//     const svixHeaders = {
//         "svix-id": headerPayLoad.get("svix-id"),
//         "svix-timestamp": headerPayLoad.get("svix-timestamp"),
//         "svix-signature": headerPayLoad.get("svix-signature"),
//     };
//     // Get the paylaod and verify it
//     const payload = await req.json();
//     const body = JSON.stringify();
//     const {data, type} = wh.verify(body, svixHeaders)

//     // Prepare the user data to be saved in database
//     const userData = {
//         _id: data.id,
//         email: data.email_addresses[0].email_address,
//         name: `${data.first_name} ${data.last_name}`,
//         image: data.image_url,
//     };

//     await connectDB();

//     switch (type) {
//         case "user.created":
//             await User.create(userData);
//             break;
           
//         case "user.updated":
//             await User.findByIdAndUpdate(data.id, userData);
//             break
            
//         case "user.deleted":
//             await User.findByIdAndDelete(data.id);
//             break    
    
//         default:
//             break;
//     }
//     return NextRequest.json({message: "Event Recieved"});
// }



// WORKING AI GIVEN CODE


// import { Webhook } from "svix";
// import connectDB from "@/config/db";
// import User from "@/models/User";

// export async function POST(req) {
//     const wh = new Webhook(process.env.SIGNING_SECRET);

//     // Get headers from the request
//     const headerPayLoad = req.headers;
//     const svixHeaders = {
//         "svix-id": headerPayLoad.get("svix-id"),
//         "svix-timestamp": headerPayLoad.get("svix-timestamp"),
//         "svix-signature": headerPayLoad.get("svix-signature"),
//     };

//     // Get the raw body of the request
//     const body = await req.text();  // Use text() instead of json()

//     // Verify the webhook using the raw body and headers
//     const { data, type } = wh.verify(body, svixHeaders);

//     // Prepare the user data to be saved in the database
//     const userData = {
//         _id: data.id,
//         email: data.email_addresses[0].email_address,
//         name: `${data.first_name} ${data.last_name}`,
//         image: data.image_url,
//     };

//     await connectDB();

//     switch (type) {
//         case "user.created":
//             await User.create(userData);
//             break;

//         case "user.updated":
//             await User.findByIdAndUpdate(data.id, userData);
//             break;

//         case "user.deleted":
//             await User.findByIdAndDelete(data.id);
//             break;

//         default:
//             break;
//     }

//     // Return the response
//     return new Response(JSON.stringify({ message: "Event Received" }), {
//         status: 200,
//     });
// }


// also working bu deletioon webhook fails in production
// import { Webhook } from "svix";
// import connectDB from "@/config/db";
// import User from "@/models/User";

// export async function POST(req) {
//     const wh = new Webhook(process.env.SIGNING_SECRET);

//     const headerPayLoad = req.headers;
//     const svixHeaders = {
//         "svix-id": headerPayLoad.get("svix-id"),
//         "svix-timestamp": headerPayLoad.get("svix-timestamp"),
//         "svix-signature": headerPayLoad.get("svix-signature"),
//     };

//     const body = await req.text();

//     let data, type;
//     try {
//         ({ data, type } = wh.verify(body, svixHeaders));
//     } catch (err) {
//         return new Response("Invalid signature", { status: 400 });
//     }

//     const userData = {
//         _id: data.id,
//         email: data.email_addresses[0].email_address,
//         name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
//         image: data.image_url,
//     };

//     await connectDB();

//     switch (type) {
//         case "user.created":
//             await User.create(userData);
//             break;

//         case "user.updated":
//             await User.findByIdAndUpdate(data.id, userData, { upsert: true });
//             break;

//         case "user.deleted":
//             await User.findByIdAndDelete(data.id);
//             break;
//     }

//     return new Response(JSON.stringify({ message: "Event Received" }), {
//         status: 200,
//     });
// }


import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";

// Disable caching and static rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // Required for crypto + svix
export const preferredRegion = "auto";

export async function POST(req) {
    try {
        const wh = new Webhook(process.env.SIGNING_SECRET);

        // Read raw body (must be text, not JSON)
        const body = await req.text();

        // Read headers
        const headerPayload = req.headers;
        const svixHeaders = {
            "svix-id": headerPayload.get("svix-id"),
            "svix-timestamp": headerPayload.get("svix-timestamp"),
            "svix-signature": headerPayload.get("svix-signature"),
        };

        // Verify webhook signature
        const evt = wh.verify(body, svixHeaders);
        const { data, type } = evt;

        await connectDB();

        // Build user data
        const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            image: data.image_url || "",
        };

        // Handle events
        switch (type) {
            case "user.created":
                await User.create(userData);
                break;

            case "user.updated":
                await User.findByIdAndUpdate(data.id, userData);
                break;

            case "user.deleted":
                await User.findByIdAndDelete(data.id);
                break;
        }

        return Response.json({ success: true, type });
    } catch (err) {
        console.error("Webhook error:", err);
        return new Response("Webhook Error", { status: 400 });
    }
}
