// app/api/admin/rooms/route.ts
import { NextResponse } from "next/server";
import { withAdmin, AdminRequest } from "@/lib/admin-auth";
import connectDB from "@/lib/mongodb";
import Room from "@/models/Room";

/**
 * GET /api/admin/rooms
 * Get all rooms with optional filters
 */
export const GET = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const building = url.searchParams.get("building");
    const floor = url.searchParams.get("floor");
    const search = url.searchParams.get("search");

    const query: any = {};

    if (building) query.building = building;
    if (floor) query.floor = floor;
    if (search) {
      query.$or = [
        { room_number: { $regex: search, $options: "i" } },
        { building: { $regex: search, $options: "i" } },
        { scanner_id: { $regex: search, $options: "i" } },
      ];
    }

    const rooms = await Room.find(query)
      .sort({ building: 1, floor: 1, room_number: 1 })
      .lean()
      .exec();

    // Get unique buildings and floors for filters
    const buildings = await Room.distinct("building");
    const floors = await Room.distinct("floor");

    return NextResponse.json({
      success: true,
      rooms,
      filters: {
        buildings: buildings.sort(),
        floors: floors.sort(),
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/rooms
 * Create a new room
 */
export const POST = withAdmin(async (request: AdminRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      room_number,
      building,
      floor,
      scanner_id,
      latitude,
      longitude,
      geofence_radius = 50,
    } = body;

    // Validate required fields
    if (!room_number || !building || !floor || !scanner_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: room_number, building, floor, scanner_id",
        },
        { status: 400 },
      );
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    // Validate coordinates
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values" },
        { status: 400 },
      );
    }

    // Check if room_number already exists
    const existingRoom = await Room.findOne({ room_number });
    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 409 },
      );
    }

    // Check if scanner_id already exists
    const existingScanner = await Room.findOne({ scanner_id });
    if (existingScanner) {
      return NextResponse.json(
        { error: "Scanner ID already exists" },
        { status: 409 },
      );
    }

    // Create room
    const room = await Room.create({
      room_number,
      building,
      floor,
      scanner_id,
      latitude,
      longitude,
      geofence_radius,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Room created successfully",
        room,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create room error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
});
